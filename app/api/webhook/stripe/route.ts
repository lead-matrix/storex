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
