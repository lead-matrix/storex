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
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // ✅ Verify payment actually succeeded
      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("Missing order_id");

      // ✅ FIXED SHIPPING (NEW STRIPE FORMAT)
      const shipping =
        session.collected_information?.shipping_details ?? null;

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

      // ✅ Atomic order update
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          fulfillment_status: "unfulfilled",
          customer_email: customer?.email || "",
          customer_name: shippingAddress.name,
          customer_phone: customer?.phone || null,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          amount_total: session.amount_total
            ? session.amount_total / 100
            : 0,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // ✅ Insert items (safe)
      if (cartItems.length > 0) {
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
        }
      }

      // ✅ Log AFTER success
      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        processed: true,
      });

      // ✅ Async email (non-blocking)
      if (customer?.email) {
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
      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        processed: true,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook failed:", error);

    // ❗ log failed attempt (important for retries)
    await supabase.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      processed: false,
      error: error.message,
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}