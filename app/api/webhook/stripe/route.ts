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

  // Idempotency
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
      if (!orderId) throw new Error("Missing order_id");

      // ✅ Fetch real order (source of truth)
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!order) throw new Error("Order not found");

      // ✅ Mark paid
      await supabase
        .from("orders")
        .update({
          status: "paid",
          customer_email: session.customer_details?.email,
          stripe_session_id: session.id,
          amount_total: session.amount_total ? session.amount_total / 100 : null,
        })
        .eq("id", orderId);
    }

    await supabase
      .from("stripe_events")
      .update({ processed: true })
      .eq("id", event.id);

  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}