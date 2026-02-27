import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");

    if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Idempotency check: prevent duplicate processing of the same Stripe event
        const { error: eventError } = await supabase
            .from('stripe_events')
            .insert([{ id: event.id }]);

        if (eventError) {
            console.warn(`🔔 Event ${event.id} already processed or conflict occurred. Skipping.`);
            return NextResponse.json({ received: true });
        }

        console.log(`🔔 Processing order for session: ${session.id}`);

        try {
            // The process_order_atomic expects p_metadata->'items' to be a JSON array.
            // We must ensure the checkout session was created with this metadata.
            const { error } = await supabase.rpc("process_order_atomic", {
                p_stripe_session_id: session.id,
                p_customer_email: session.customer_details?.email,
                p_amount_total: session.amount_total,
                p_currency: session.currency,
                p_metadata: session.metadata,
            });

            if (error) {
                console.error("❌ Atomic DB processing failed:", error.message);
                throw error;
            }

            console.log(`✅ Order ${session.id} processed successfully.`);
        } catch (err: any) {
            console.error("❌ Order processing failed:", err);
            // Delete the event record if processing fails so it can be retried
            await supabase.from('stripe_events').delete().eq('id', event.id);
            return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
