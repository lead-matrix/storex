import { NextResponse } from 'next/server';
import 'server-only';
import Stripe from 'stripe';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { calculateTotalWeightLb, calculateShippingRate } from '@/lib/utils/shippo';
import { checkoutLimiter } from '@/lib/api/rateLimit';
import type { CartItem } from '@/types/product';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

export const INTL_COUNTRIES = [
  'CA','GB','AU','NZ','FR','DE','ES','IT','NL','BE','SE','NO','DK','FI',
  'JP','KR','SG','MY','PH','TH','VN','IN','AE','SA','MX','BR','ZA','PL','TR',
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export const ALL_COUNTRIES = ['US', ...INTL_COUNTRIES] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

async function getShippingConfig(): Promise<any> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc('get_shipping_config');

  if (error) {
    console.error('[Shipping Config] RPC Error:', error);
    return {};
  }
  return data ?? {};
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
  rawItems: { productId: string; variantId?: string | null; quantity: number }[],
  options: { email?: string; couponCode?: string | null } = {}
): Promise<CheckoutSessionResult> {
  const supabase = await createAdminClient();
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

  const totalWeightLb = calculateTotalWeightLb(validatedItems);
  const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Coupon Validation ─────────────────────────────────────────────
  let discountAmount = 0;
  let validCouponCode = null;
  if (options.couponCode) {
    const { data: couponVal, error: couponError } = await supabase.rpc('validate_coupon', {
      p_code: options.couponCode,
      p_purchase_amount: subtotal
    });
    if (!couponError && couponVal?.valid) {
      discountAmount = Number(couponVal.discount_amount);
      validCouponCode = options.couponCode;
    }
  }

  const cfg = await getShippingConfig();
  const isFree = subtotal >= parseFloat(cfg.free_shipping_threshold ?? '100');

  const stdRate     = calculateShippingRate(totalWeightLb, subtotal, cfg, 'standard');
  const expRate     = calculateShippingRate(totalWeightLb, subtotal, cfg, 'express');
  const intlStdRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_standard');
  const intlExpRate = calculateShippingRate(totalWeightLb, subtotal, cfg, 'intl_express');

  const shippingOptions = buildShippingOptions(stdRate, expRate, intlStdRate, intlExpRate);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: 'pending',
      customer_email: options.email || 'pending@stripe',
      amount_total: subtotal + stdRate.cost - discountAmount,
      shipping_address: null,
      metadata: {
        weight_lb: totalWeightLb.toFixed(3),
        subtotal: subtotal.toFixed(2),
        is_free_shipping: isFree,
        coupon_code: validCouponCode,
        discount_amount: discountAmount.toFixed(2),
      },
    })
    .select('id')
    .single();


  if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

  try {
    const { error: reserveError } = await supabase.rpc('check_and_reserve_inventory', {
      p_items: validatedItems.map(i => ({
        product_id: i.productId,
        variant_id: i.variantId,
        quantity: i.quantity,
      })),
      p_order_id: order.id,
      p_expires_in: '30 minutes',
    });

    if (reserveError) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', metadata: { error: reserveError.message } })
        .eq('id', order.id);
      throw new Error(`Inventory reservation failed: ${reserveError.message}`);
    }
  } catch (err: any) {
    console.error('[Checkout Reservation Error]', err.message);
    throw err;
  }

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

  if (discountAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Discount (${validCouponCode})`,
        },
        unit_amount: -Math.round(discountAmount * 100),
      },
      quantity: 1,
    } as any);
  }


  // NOTE: Stripe enforces a 500-character limit per metadata value.
  // We store only order_id here — the webhook fetches cart items from the DB
  // using order_id as the source of truth. Never serialize cart items into metadata.
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
        coupon_code: validCouponCode ?? '',
      },
      customer_email: options.email || undefined,
    },
    { idempotencyKey: `checkout_${order.id}` }
  );


  return { url: session.url!, orderId: order.id };
}

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

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkoutLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await request.json();
    const result = await createCheckoutSession(body.items || [], {
        email: body.email,
        couponCode: body.couponCode
    });
    return Response.json(result);

  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
