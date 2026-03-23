import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        console.error("Missing stripe-signature header");
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
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Check for duplicate delivery (idempotency check ONLY — do NOT log yet)
    const { data: existingEvent } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", event.id)
        .single();

    if (existingEvent) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            let cartItems = [];
            try {
                cartItems = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
            } catch (e) {
                console.error("Failed to parse cart items from metadata:", e);
            }

            // 2. Process the order atomically FIRST — only log event on success
            const { error: rpcError, data: orderId } = await supabase.rpc("process_order_atomic", {
                p_stripe_session_id: session.id,
                p_customer_email: session.customer_details?.email || session.customer_email || 'guest@stripe.com',
                p_amount_total: session.amount_total,
                p_currency: session.currency,
                p_metadata: {
                    ...session.metadata,
                    items: cartItems
                },
                p_shipping_address: (session as any).shipping_details || null,
                p_billing_address: session.customer_details || null
            });

            if (rpcError) {
                // DO NOT log event — let Stripe retry
                console.error("Atomic order processing failed (RPC):", rpcError);
                throw new Error(`RPC Processing Error: ${rpcError.message}`);
            }

            // 3. ONLY NOW log the event — proves processing was successful
            await supabase.from("stripe_events").insert({
                id: event.id,
                type: event.type,
                data: event.data.object as any,
            }).throwOnError();

            const email = session.customer_details?.email || session.customer_email;
            const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

            if (orderId && email) {
                try {
                    const { sendOrderConfirmationEmail } = await import("@/lib/utils/email");
                    await sendOrderConfirmationEmail({
                        orderId,
                        customerEmail: email,
                        customerName: session.customer_details?.name || 'Valued Client',
                        totalAmount: amountTotal,
                        items: cartItems
                    });
                } catch (emailErr: any) {
                    console.error("Failed to send order confirmation email:", emailErr);
                }
            }
        } else {
            // For non-checkout events, log immediately (no critical processing)
            await supabase.from("stripe_events").insert({
                id: event.id,
                type: event.type,
                data: event.data.object as any,
            });
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook event processing failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
