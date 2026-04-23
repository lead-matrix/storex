import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Idempotency — skip events we already processed
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id, processed")
    .eq("id", event.id)
    .maybeSingle();

  if (existing?.processed) {
    return NextResponse.json({ received: true });
  }

  await supabase.from("stripe_events").upsert({
    id: event.id,
    type: event.type,
    data: event.data,
    processed: false,
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Missing order_id in session metadata");

      // Confirm the order exists
      const { data: order, error: orderFetchError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (orderFetchError || !order) throw new Error("Order not found");

      // Idempotency: if already paid, skip processing
      if (order.status === "paid") {
        await supabase.from("stripe_events").update({ processed: true }).eq("id", event.id);
        return NextResponse.json({ received: true });
      }

      // ── 1. Parse shipping/billing addresses from Stripe ──────────────────
      const shippingDetails = session.shipping_details;
      const customerDetails = session.customer_details;

      const shippingAddress = shippingDetails?.address
        ? {
            name: shippingDetails.name ?? customerDetails?.name ?? null,
            line1: shippingDetails.address.line1,
            line2: shippingDetails.address.line2 ?? null,
            city: shippingDetails.address.city,
            state: shippingDetails.address.state,
            postal_code: shippingDetails.address.postal_code,
            country: shippingDetails.address.country,
          }
        : null;

      const billingAddress = customerDetails?.address
        ? {
            name: customerDetails.name ?? null,
            line1: customerDetails.address.line1,
            line2: customerDetails.address.line2 ?? null,
            city: customerDetails.address.city,
            state: customerDetails.address.state,
            postal_code: customerDetails.address.postal_code,
            country: customerDetails.address.country,
          }
        : null;

      // ── 2. Update order to paid + populate address/contact fields ─────────
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          fulfillment_status: "unfulfilled",
          customer_email: customerDetails?.email ?? null,
          customer_name: shippingDetails?.name ?? customerDetails?.name ?? null,
          customer_phone: customerDetails?.phone ?? null,
          stripe_session_id: session.id,
          amount_total: session.amount_total ? session.amount_total / 100 : null,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw new Error(`Order update failed: ${updateError.message}`);

      // ── 3. Insert order_items from inventory_reservations ─────────────────
      // The checkout flow reserved inventory using the order_id as session_id.
      // We read those reservations to build order_items, then finalize inventory.
      const { data: reservations, error: resError } = await supabase
        .from("inventory_reservations")
        .select(`
          product_id,
          variant_id,
          quantity,
          products ( title, base_price, sale_price, on_sale, weight_oz ),
          product_variants ( name, price_override, weight )
        `)
        .eq("session_id", orderId);

      if (resError) throw new Error(`Reservation fetch failed: ${resError.message}`);

      if (reservations && reservations.length > 0) {
        // Check if order_items already exist (extra idempotency guard)
        const { count: existingItems } = await supabase
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .eq("order_id", orderId);

        if (!existingItems || existingItems === 0) {
          const orderItems = reservations.map((res: any) => {
            const product = res.products;
            const variant = res.product_variants;

            // Price: variant override > sale price > base price
            let price = Number(product?.base_price ?? 0);
            if (product?.on_sale && product?.sale_price != null) {
              price = Number(product.sale_price);
            }
            if (variant?.price_override != null) {
              price = Number(variant.price_override);
            }

            const productName = product?.title ?? "Unknown Product";
            const variantName = variant?.name ?? null;

            return {
              order_id: orderId,
              product_id: res.product_id,
              variant_id: res.variant_id ?? null,
              quantity: res.quantity,
              price,
              product_name: productName,
              variant_name: variantName,
              fulfilled_quantity: 0,
            };
          });

          const { error: itemsInsertError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (itemsInsertError) {
            throw new Error(`order_items insert failed: ${itemsInsertError.message}`);
          }
        }

        // ── 4. Finalize inventory: deduct stock + clear reservations ──────────
        const { error: finalizeError } = await supabase.rpc("finalize_order_inventory", {
          p_order_id: orderId,
        });

        if (finalizeError) {
          // Non-fatal: log but don't fail the webhook — stock can be reconciled manually
          console.error(`[Webhook] finalize_order_inventory failed for ${orderId}:`, finalizeError.message);
        }
      } else {
        // No reservations found — log a warning (cart may have expired before payment)
        console.warn(`[Webhook] No inventory reservations found for order ${orderId}. order_items will be empty.`);
      }
    }

    // Mark event as processed
    await supabase
      .from("stripe_events")
      .update({ processed: true })
      .eq("id", event.id);

  } catch (err: any) {
    console.error("[Stripe Webhook Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
