import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
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

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;

      // ✅ Verify payment actually succeeded
      if (session.payment_status !== "paid") {
        console.warn(`[Stripe Webhook] Order ${session.metadata?.order_id} is unpaid. Waiting for async_payment_succeeded.`);
        // Don't throw error, just log it and return 200 so Stripe doesn't retry this specific event. 
        // We will catch async_payment_succeeded later.
        await supabase.from("stripe_events").upsert({
          id: event.id,
          type: event.type,
          processed: true,
          error: "Payment not completed yet",
        }, { onConflict: 'id' });
        return NextResponse.json({ received: true, status: "pending_payment" });
      }

      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Missing order_id");

      // ✅ FIXED SHIPPING — check both SDK formats
      const sessionAny = session as any;
      const shipping =
        sessionAny.shipping_details ?? sessionAny.collected_information?.shipping_details ?? sessionAny.customer_details?.address ?? null;

      const customer = session.customer_details ?? null;

      // ✅ Safe parsing
      let cartItems: any[] = [];
      try {
        cartItems = session.metadata?.items
          ? JSON.parse(session.metadata.items)
          : [];
      } catch {
        cartItems = [];
      }

      // ✅ Defensive data extraction
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

      // ✅ Atomic order update
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          fulfillment_status: "unfulfilled",
          customer_email: customer?.email || "",
          customer_name: shippingAddress.name || customer?.name || "Customer",
          customer_phone: customer?.phone || null,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
          metadata: {
            stripe_session_id: session.id,
            shipping_cost_cents: chosenShipping?.amount_total ?? 0,
            shipping_label: (session as any).shipping_details?.dynamic_tax_locations?.[0] ?? "selected_in_stripe",
          },
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // ✅ Insert items only if order is paid correctly
      if (cartItems.length > 0) {
        // First check if items already exist (if async_payment_succeeded fired after session.completed)
        const { data: existingItems } = await supabase.from("order_items").select("id").eq("order_id", orderId);
        if (!existingItems || existingItems.length === 0) {
            const { error: itemsError } = await supabase
            .from("order_items")
            .insert(
                cartItems.map((item) => ({
                order_id: orderId,
                product_id: item.product_id,
                variant_id: item.variant_id || null,
                quantity: item.quantity,
                price: item.price,
                fulfilled_quantity: 0,
                }))
            );

            if (itemsError) {
              console.error("Items insert failed", itemsError);
            } else {
              for (const item of cartItems) {
                if (item.variant_id) {
                    const { data: v } = await supabase.from('product_variants').select('stock').eq('id', item.variant_id).single();
                    if (v && v.stock !== undefined) {
                      await supabase.from('product_variants').update({ stock: Math.max(0, v.stock - item.quantity) }).eq('id', item.variant_id);
                    }
                } else if (item.product_id) {
                    const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (p && p.stock !== undefined) {
                      await supabase.from('products').update({ stock: Math.max(0, p.stock - item.quantity) }).eq('id', item.product_id);
                    }
                }
              }
            }
        }
      }

      // ✅ Log AFTER success
      await supabase.from("stripe_events").upsert({
        id: event.id,
        type: event.type,
        processed: true,
      }, { onConflict: 'id' });

      // ✅ Async email (non-blocking)
      if (customer?.email) {
        // Send order confirmation only down this path securely
        import("@/lib/utils/email")
          .then(({ sendOrderConfirmationEmail }) =>
            sendOrderConfirmationEmail({
              orderId,
              customerEmail: customer.email!,
              customerName: customer.name || "Customer",
              totalAmount: (session.amount_total || 0) / 100,
              items: cartItems,
            })
          )
          .catch(() => {});
      }
    } else {
      // log other events
      await supabase.from("stripe_events").upsert({
        id: event.id,
        type: event.type,
        processed: true,
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook failed:", error);

    // ❗ log failed attempt (important for retries) using UPSERT
    await supabase.from("stripe_events").upsert({
      id: event.id,
      type: event.type,
      processed: false,
      error: error.message,
    }, { onConflict: 'id' });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}