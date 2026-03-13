import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/utils/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover" as any,
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

    // 1. Store Stripe event ID for audit trail & idempotency
    const { data: existingEvent } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", event.id)
        .single();

    if (existingEvent) {
        console.log(`Event ${event.id} already processed. Skipping.`);
        return NextResponse.json({ received: true, duplicate: true });
    }

    // 2. Log the event for audit trail
    const { error: logError } = await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        data: event.data.object as any,
    });

    if (logError) {
        console.error("Failed to log stripe event:", logError);
        // We continue anyway, but the RPC will also have its own checks
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log(`Processing checkout session completion: ${session.id}`);

            // Parse metadata items if they were stringified in the checkout route
            let cartItems = [];
            try {
                cartItems = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
            } catch (e) {
                console.error("Failed to parse cart items from metadata:", e);
            }

            // 2. Process the order atomically in the database
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
                console.error("Atomic order processing failed (RPC):", rpcError);
                throw new Error(`RPC Processing Error: ${rpcError.message}`);
            }

            console.log(`Order processed successfully. Order ID: ${orderId}`);

            const email = session.customer_details?.email || session.customer_email;
            const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

            if (orderId && email) {
                // 3. Fire Email Notification
                try {
                    await sendOrderConfirmationEmail({
                        orderId,
                        customerEmail: email,
                        customerName: session.customer_details?.name || 'Valued Client',
                        totalAmount: amountTotal,
                        items: cartItems
                    });
                    console.log(`Order confirmation email sent to: ${email}`);
                } catch (emailErr: any) {
                    console.error("Failed to send order confirmation email:", emailErr);
                    // Don't throw here - we don't want to tell Stripe it failed if the order is already paid in DB
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook event processing failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
