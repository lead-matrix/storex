import 'server-only';
import Stripe from 'stripe';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { calculateTotalWeightLb, calculateShippingRate } from '@/lib/utils/shippo';
import type { CartItem } from '@/types/product';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

export const INTL_COUNTRIES = [
  'CA','GB','AU','NZ','FR','DE','ES','IT','NL','BE','SE','NO','DK','FI',
  'JP','KR','SG','MY','PH','TH','VN','IN','AE','SA','MX','BR','ZA','PL','TR',
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export const ALL_COUNTRIES = ['US', ...INTL_COUNTRIES] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

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

export async function createCheckoutSession(
  rawItems: { productId: string; variantId?: string | null; quantity: number }[]
): Promise<CheckoutSessionResult> {
  const supabase = await createAdminClient();

  // 1. Validate products
  const productIds = rawItems.map(i => i.productId);
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, title, base_price, sale_price, on_sale, stock, weight_oz')
    .in('id', productIds);

  if (!dbProducts?.length) throw new Error('Invalid products');

  const variantIds = rawItems.flatMap(i => i.variantId ? [i.variantId] : []);
  let dbVariants: any[] = [];

  if (variantIds.length) {
    const { data } = await supabase
      .from('product_variants')
      .select('id, name, price_override, weight')
      .in('id', variantIds);
    dbVariants = data ?? [];
  }

  const validatedItems: ValidatedCartItem[] = rawItems.map(item => {
    const product = dbProducts.find(p => p.id === item.productId);
    if (!product) throw new Error('Invalid product');

    const variant = dbVariants.find(v => v.id === item.variantId);

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

  // 2. Totals
  const totalWeightLb = calculateTotalWeightLb(validatedItems);
  const subtotal = validatedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // 3. Shipping
  const cfg = await getShippingConfig();
  const std = calculateShippingRate(totalWeightLb, subtotal, cfg, 'standard');
  const exp = calculateShippingRate(totalWeightLb, subtotal, cfg, 'express');
  const intlStd = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_standard');
  const intlExp = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_express');

  const shippingOptions = buildShippingOptions(std, exp, intlStd, intlExp);

  // 4. Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      status: 'pending',
      customer_email: 'pending@stripe',
      amount_total: subtotal + std.cost,
      metadata: {
        subtotal,
        weight_lb: totalWeightLb,
      },
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // 5. Stripe session
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: validatedItems.map(i => ({
        price_data: {
          currency: 'usd',
          product_data: { name: i.name },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.quantity,
      })),
      shipping_address_collection: { allowed_countries: ALL_COUNTRIES },
      shipping_options: shippingOptions,
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/shop`,

      // ✅ FIXED (NO LARGE METADATA)
      metadata: {
        order_id: order.id,
      },
    },
    { idempotencyKey: `checkout_${order.id}` }
  );

  return { url: session.url!, orderId: order.id };
}

function buildShippingOptions(std: any, exp: any, intlStd: any, intlExp: any) {
  const make = (r: any) => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: Math.round(r.cost * 100), currency: 'usd' },
      display_name: r.name,
    },
  });
  return [make(std), make(exp), make(intlStd), make(intlExp)];
}