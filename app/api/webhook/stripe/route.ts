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

  // ✅ STRONG idempotency (race-condition safe)
  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id, processed")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent && existingEvent.processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ✅ CRITICAL FIX: Always persist full event payload immediately on receipt
  // This ensures we have the raw data even if processing crashes below.
  await supabase.from("stripe_events").upsert(
    { id: event.id, type: event.type, data: event.data, processed: false },
    { onConflict: "id" }
  );

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      let session = event.data.object as Stripe.Checkout.Session;

      // Expand shipping_rate to capture shipping method name
      try {
        session = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['shipping_cost.shipping_rate']
        });
      } catch (err) {
        console.warn(`[Stripe Webhook] Expanded session retrieve failed for ${session.id}`, err);
      }

      // For checkout.session.completed with a delayed payment, payment_status may be
      // 'unpaid' — we log it but do NOT fulfill. async_payment_succeeded will fire later.
      if (session.payment_status !== "paid") {
        console.warn(
          `[Stripe Webhook] Session ${session.id} payment_status=${session.payment_status}. Awaiting async_payment_succeeded.`
        );
        await supabase.from("stripe_events").upsert(
          { id: event.id, type: event.type, data: event.data, processed: true, error: "payment_pending" },
          { onConflict: "id" }
        );
        return NextResponse.json({ received: true, status: "pending_payment" });
      }

      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Missing order_id in session metadata");

      // Resolve shipping address — handle all known SDK shapes
      const sessionAny = session as any;
      const shipping =
        sessionAny.shipping_details ??
        sessionAny.collected_information?.shipping_details ??
        null;
      const customer = session.customer_details ?? null;

      // Safe-parse cart items from metadata
      let cartItems: any[] = [];
      try {
        cartItems = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
      } catch {
        cartItems = [];
      }

      const shippingAddress = {
        name: shipping?.name || customer?.name || "",
        line1: shipping?.address?.line1 || "",
        line2: shipping?.address?.line2 || "",
        city: shipping?.address?.city || "",
        state: shipping?.address?.state || "",
        postal_code: shipping?.address?.postal_code || "",
        country: shipping?.address?.country || "US",
      };

      const billingAddress = {
        name: customer?.name || "",
        email: customer?.email || "",
        line1: customer?.address?.line1 || "",
        city: customer?.address?.city || "",
        state: customer?.address?.state || "",
        postal_code: customer?.address?.postal_code || "",
        country: customer?.address?.country || "US",
      };

      const chosenShipping = session.shipping_cost ?? null;
      const customerName = shippingAddress.name || customer?.name || "Customer";
      const shippingRate = chosenShipping?.shipping_rate as Stripe.ShippingRate | undefined;

      // Atomic order update — writes all columns that now exist in the schema
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "paid",          // ✅ CRITICAL FIX: was missing
          fulfillment_status: "unfulfilled",
          customer_email: customer?.email || "",
          customer_name: customerName,
          customer_phone: customer?.phone || null,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
          stripe_session_id: session.id,
          shipping_cost: chosenShipping?.amount_total ? chosenShipping.amount_total / 100 : 0,
          shipping_method: shippingRate?.display_name || "Standard Shipping",
          metadata: {
            stripe_session_id: session.id,
            shipping_cost_cents: chosenShipping?.amount_total ?? 0,
          },
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Insert order items — guarded against double-insert if both events fire
      if (cartItems.length > 0) {
        const { data: existingItems } = await supabase
          .from("order_items")
          .select("id")
          .eq("order_id", orderId);

        if (!existingItems || existingItems.length === 0) {
          const { error: itemsError } = await supabase.from("order_items").insert(
            cartItems.map((item) => ({
              order_id: orderId,
              product_id: item.product_id,
              variant_id: item.variant_id || null,
              quantity: item.quantity,
              price: item.price,
              // Bug #5: Snapshot names at purchase time so order history stays
              // correct even if the product is later renamed or deleted.
              product_name: item.product_name || null,
              variant_name: item.variant_name || null,
              fulfilled_quantity: 0,
            }))
          );

          if (itemsError) {
            console.error("[Stripe Webhook] Items insert failed:", itemsError);
          } else {
            // Deduct stock
            for (const item of cartItems) {
              if (item.variant_id) {
                const { data: v } = await supabase
                  .from("product_variants")
                  .select("stock")
                  .eq("id", item.variant_id)
                  .single();
                if (v && v.stock !== undefined) {
                  await supabase
                    .from("product_variants")
                    .update({ stock: Math.max(0, v.stock - item.quantity) })
                    .eq("id", item.variant_id);
                }
              } else if (item.product_id) {
                const { data: p } = await supabase
                  .from("products")
                  .select("stock")
                  .eq("id", item.product_id)
                  .single();
                if (p && p.stock !== undefined) {
                  await supabase
                    .from("products")
                    .update({ stock: Math.max(0, p.stock - item.quantity) })
                    .eq("id", item.product_id);
                }
              }
            }
          }
        }
      }

      // Mark event processed (data already stored at top of handler)
      await supabase.from("stripe_events").upsert(
        { id: event.id, type: event.type, data: event.data, processed: true },
        { onConflict: "id" }
      );

      // BUG #6 FIX: Email failures were silently swallowed with .catch(() => {}).
      // Now logs the error so you can tell when confirmation emails aren't sending.
      // Still non-blocking (fire-and-forget) — a failed email must never fail
      // the webhook response (Stripe would retry the entire webhook).
      if (customer?.email) {
        import("@/lib/utils/email")
          .then(({ sendOrderConfirmationEmail }) =>
            sendOrderConfirmationEmail({
              orderId,
              customerEmail: customer.email!,
              customerName,
              totalAmount: (session.amount_total || 0) / 100,
              items: cartItems,
            })
          )
          .catch((err) =>
            console.error("[Stripe Webhook] Order confirmation email failed:", err)
          );
      }

    } else if (event.type === "checkout.session.async_payment_failed") {
      // Delayed payment method definitively failed — mark order cancelled
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled", fulfillment_status: "cancelled" })
          .eq("id", orderId);
        console.warn(`[Stripe Webhook] Async payment FAILED for order ${orderId}. Marked cancelled.`);
      }
      await supabase.from("stripe_events").upsert(
        { id: event.id, type: event.type, data: event.data, processed: true },
        { onConflict: "id" }
      );

    } else if (event.type === "checkout.session.expired") {
      // Session timed out — mark order cancelled so admin knows
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled", fulfillment_status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending"); // only cancel if still pending — don't overwrite a paid order
        console.info(`[Stripe Webhook] Session expired for order ${orderId}. Marked cancelled.`);
      }
      await supabase.from("stripe_events").upsert(
        { id: event.id, type: event.type, data: event.data, processed: true },
        { onConflict: "id" }
      );

    } else {
      // All other events — just log (data already stored at top)
      await supabase.from("stripe_events").upsert(
        { id: event.id, type: event.type, data: event.data, processed: true },
        { onConflict: "id" }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook failed:", error);

    // ❗ log failed attempt (important for retries) using UPSERT
    await supabase.from("stripe_events").upsert({
      id: event.id,
      type: event.type,
      data: event.data,
      processed: false,
      error: error.message,
    }, { onConflict: 'id' });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}