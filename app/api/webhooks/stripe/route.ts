import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Service-role client — bypasses RLS, safe server-side only
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Signature verification failed";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // ── Idempotency: skip if already processed ───────────────────────────
        const { error: dupError } = await supabase
            .from("stripe_events")
            .insert([{ id: event.id }]);

        if (dupError) {
            // Already processed — idempotency guard
            return NextResponse.json({ received: true });
        }

        // ── Grab guest/customer email from Stripe session ────────────────────
        const customerEmail =
            session.customer_details?.email ??
            session.customer_email ??
            null;

        const orderId = session.metadata?.order_id ?? null;

        try {
            // ── Atomic: update order status, save email, deduct inventory ─────
            const { error } = await supabase.rpc("process_order_atomic", {
                p_stripe_session_id: session.id,
                p_customer_email: customerEmail,
                p_amount_total: session.amount_total,
                p_currency: session.currency,
                p_metadata: session.metadata,
            });

            if (error) {
                throw error;
            }

            // ── If the RPC doesn't update email, do it directly ───────────────
            // (covers guests whose email wasn't known at order creation time)
            if (customerEmail && orderId) {
                await supabase
                    .from("orders")
                    .update({ customer_email: customerEmail, status: "paid" })
                    .eq("id", orderId);
            }
        } catch {
            // Remove event record so Stripe can retry
            await supabase.from("stripe_events").delete().eq("id", event.id);
            return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
