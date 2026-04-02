import 'server-only';
import Stripe from 'stripe';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { calculateTotalWeightLb, calculateShippingRate } from '@/lib/utils/shippo';
import type { CartItem } from '@/types/product';

// ── Stripe init ──────────────────────────────────────────────────────────────
// NOTE: The user requested to change the API version to '2025-01-27.acacia'
// All four Stripe initialisations must use this same version string.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

// ── Allowed shipping countries ───────────────────────────────────────────────
export const INTL_COUNTRIES = [
  'CA','GB','AU','NZ','FR','DE','ES','IT','NL','BE','SE','NO','DK','FI',
  'JP','KR','SG','MY','PH','TH','VN','IN','AE','SA','MX','BR','ZA','PL','TR',
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export const ALL_COUNTRIES = ['US', ...INTL_COUNTRIES] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

// ── Shipping config cache (5 min TTL) ────────────────────────────────────────
let _shippingConfigCache: any = null;
let _shippingCacheTs = 0;
const SHIPPING_CACHE_TTL = 5 * 60 * 1000;

async function getShippingConfig(): Promise<any> {
  const now = Date.now();
  if (_shippingConfigCache && now - _shippingCacheTs < SHIPPING_CACHE_TTL) {
    return _shippingConfigCache;
  }
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', 'shipping_settings')
    .maybeSingle();

  _shippingConfigCache = data?.setting_value ?? {};
  _shippingCacheTs = now;
  return _shippingConfigCache;
}

export type ValidatedCartItem = CartItem & {
  name: string;
  price: number;
  variant_weight_oz: number | null;
  product_weight_oz: number | null;
};

export type CheckoutSessionResult = {
  url: string;
  orderId: string;
};

/**
 * checkoutService
 * Validates cart items, locks server-side prices, calculates shipping,
 * creates a pending order, and initiates a Stripe checkout session.
 * The API route only passes parsed JSON to this service.
 */
export async function createCheckoutSession(
  rawItems: { productId: string; variantId?: string | null; quantity: number }[]
): Promise<CheckoutSessionResult> {
  const supabase = await createAdminClient();

  // 1 ─ Validate & lock prices (server-authoritative)
  const productIds = rawItems.map(i => i.productId);
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, title, base_price, sale_price, on_sale, stock, weight_oz')
    .in('id', productIds);

  if (!dbProducts || dbProducts.length === 0) throw new Error('Some products are invalid or unavailable');

  const variantIds = rawItems.flatMap(i => i.variantId ? [i.variantId] : []);
  let dbVariants: any[] = [];
  if (variantIds.length > 0) {
    const { data } = await supabase
      .from('product_variants')
      .select('id, name, price_override, weight')
      .in('id', variantIds);
    dbVariants = data ?? [];
  }

  const validatedItems: ValidatedCartItem[] = rawItems.map(item => {
    const product = dbProducts.find((p: any) => p.id === item.productId);
    if (!product) throw new Error('Invalid product in cart');
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.title}`);

    const variant = dbVariants.find((v: any) => v.id === item.variantId);

    // BUG #1 FIX: Correct price precedence.
    // Previous code applied sale_price AFTER variant.price_override, silently
    // overwriting it. The correct hierarchy is:
    //   1. Start with base_price
    //   2. Apply sale_price if product is on sale (discounts the base)
    //   3. Variant price_override always wins — it's an explicit per-SKU price
    //      set by the admin (e.g. a premium shade costs more regardless of sale)
    let price = Number(product.base_price);
    if (product.on_sale && product.sale_price != null) price = Number(product.sale_price);
    if (variant?.price_override != null) price = Number(variant.price_override);

    return {
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      name: variant?.name ? `${product.title} — ${variant.name}` : product.title,
      price,
      variant_weight_oz: variant?.weight ? Number(variant.weight) : null,
      product_weight_oz: product.weight_oz ? Number(product.weight_oz) : null,
    };
  });

  // 2 ─ Compute weight & subtotal
  const totalWeightLb = calculateTotalWeightLb(validatedItems);
  const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 3 ─ Build shipping options from DB config
  const cfg = await getShippingConfig();
  const isFree = subtotal >= parseFloat(cfg.free_shipping_threshold ?? '100');
  const stdRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'standard');
  const expRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'express');
  const intlStdRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_standard');
  const intlExpRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_express');

  const shippingOptions = buildShippingOptions(stdRate, expRate, intlStdRate, intlExpRate);

  // 4 ─ Create pending order (webhook will upgrade to 'paid')
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: 'pending',
      customer_email: 'pending@stripe',
      amount_total: subtotal + stdRate.cost,
      shipping_address: null,
      metadata: {
        weight_lb: totalWeightLb.toFixed(3),
        subtotal: subtotal.toFixed(2),
        is_free_shipping: isFree,
      },
    })
    .select('id')
    .single();

  if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

  // 4b ─ Reserve Inventory for this Order (30 min window)
  // This prevents ghost inventory issues during the Stripe checkout window.
  try {
    const { error: reserveError } = await supabase.rpc('check_and_reserve_inventory', {
      p_items: validatedItems.map(i => ({
        product_id: i.productId,
        variant_id: i.variantId,
        quantity: i.quantity
      })),
      p_order_id: order.id,
      p_expires_in: '30 minutes'
    });

    if (reserveError) {
      // If reservation fails (stock gone between validation and reservation), mark order cancelled
      await supabase.from('orders').update({ status: 'cancelled', metadata: { error: reserveError.message } }).eq('id', order.id);
      throw new Error(`Inventory reservation failed: ${reserveError.message}`);
    }
  } catch (err: any) {
    console.error('[Checkout Reservation Error]', err.message);
    throw err;
  }

  // 5 ─ Create Stripe checkout session
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dinacosmetic.store';
  const lineItems = validatedItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        metadata: { product_id: item.productId, variant_id: item.variantId ?? '' },
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ALL_COUNTRIES },
      phone_number_collection: { enabled: true },
      shipping_options: shippingOptions,
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/shop`,
      automatic_tax: { enabled: true },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      metadata: {
        order_id: order.id,
        subtotal: subtotal.toFixed(2),
        weight_lb: totalWeightLb.toFixed(3),
        items: JSON.stringify(
          validatedItems.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId ?? null,
            quantity: i.quantity,
            price: i.price,
          }))
        ),
      },
    },
    { idempotencyKey: `checkout_${order.id}` }
  );

  return { url: session.url!, orderId: order.id };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildShippingOptions(
  std: ReturnType<typeof calculateShippingRate>,
  exp: ReturnType<typeof calculateShippingRate>,
  intlStd: ReturnType<typeof calculateShippingRate>,
  intlExp: ReturnType<typeof calculateShippingRate>
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  const opt = (
    rate: ReturnType<typeof calculateShippingRate>
  ): Stripe.Checkout.SessionCreateParams.ShippingOption => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: Math.round(rate.cost * 100), currency: 'usd' },
      display_name: rate.name,
      delivery_estimate: {
        minimum: { unit: 'business_day', value: rate.minDays },
        maximum: { unit: 'business_day', value: rate.maxDays },
      },
    },
  });
  return [opt(std), opt(exp), opt(intlStd), opt(intlExp)];
}
