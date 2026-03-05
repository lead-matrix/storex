import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");

    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: unknown) {
        return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Idempotency check 
        const { error: dupError } = await supabase
            .from("stripe_events")
            .insert([{ id: event.id }]);
        if (dupError) return NextResponse.json({ received: true });

        const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
        const metadata = session.metadata || {};
        const items = metadata.items ? JSON.parse(metadata.items) : [];
        const userId = metadata.user_id || null;
        const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;

        try {
            // New V2 Webhook Architecture
            // Uses atomic RPC: fulfill_webhook_order to create the order, payment, items, and deduct inventory securely
            const { error: rpcError, data: orderId } = await supabase.rpc("fulfill_webhook_order", {
                p_stripe_session_id: session.id,
                p_payment_intent: paymentIntent,
                p_customer_email: customerEmail,
                p_user_id: userId,
                p_amount: session.amount_total ? session.amount_total / 100 : 0,
                p_currency: session.currency || 'usd',
                p_shipping_address: session.shipping_details?.address || {},
                p_items: items
            });

            if (rpcError) {
                // Fallback to legacy process_order_atomic for backward compatibility 
                // until the V2 schema is fully executed on production.
                console.error("V2 Fulfillment Failed. Falling back to V1:", rpcError);
                await supabase.rpc("process_order_atomic", {
                    p_stripe_session_id: session.id,
                    p_customer_email: customerEmail,
                    p_amount_total: session.amount_total,
                    p_currency: session.currency,
                    p_metadata: metadata,
                });
            }
        } catch {
            await supabase.from("stripe_events").delete().eq("id", event.id);
            return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
