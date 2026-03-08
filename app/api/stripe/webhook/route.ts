import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "@/lib/utils/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key to bypass RLS
);

export async function POST(req: Request) {
    const body = await req.text();

    const headersList = await headers();
    const signature = headersList.get("stripe-signature")!;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Webhook signature verification failed.");
        return NextResponse.json({ error: "Webhook error" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Use the atomic RPC to:
        // 1. Mark order as paid
        // 2. Insert all order items
        // 3. Deduct stock from products and variants
        // All in one Postgres transaction.
        const { error: rpcError } = await supabase.rpc("process_order_atomic", {
            p_stripe_session_id: session.id,
            p_customer_email: session.customer_details?.email || session.customer_email,
            p_amount_total: session.amount_total,
            p_currency: session.currency,
            p_metadata: {
                ...session.metadata,
                items: session.metadata?.items ? JSON.parse(session.metadata.items) : []
            }
        });

        if (rpcError) {
            console.error("Atomic order processing failed:", rpcError);
        }

        const orderId = session.metadata?.order_id;
        const email = session.customer_details?.email || session.customer_email;
        const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

        if (orderId && email && !rpcError) {
            // Fire Resend Email
            await sendOrderConfirmationEmail({
                orderId,
                customerEmail: email,
                customerName: session.customer_details?.name || 'Valued Client',
                totalAmount: amountTotal,
            });
        }
    }

    return NextResponse.json({ received: true });
}
