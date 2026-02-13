import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/utils/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
        console.error("Missing Stripe Environment Variables");
        return new NextResponse("Configuration Error", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27-acacia' as any,
    });

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    // 1. Verify Signature
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed:`, err.message);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // 2. Handle Events
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'payment') {
                    await handleOneTimePayment(session);
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error(`❌ Webhook handler failed:`, error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}

// --- Helper Functions ---

async function handleOneTimePayment(session: Stripe.Checkout.Session) {
    if (!session.metadata?.orderId) return;

    await supabaseAdmin
        .from('orders')
        .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string
        })
        .eq('id', session.metadata.orderId);

    // Trigger Order Confirmation Email
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Valued Client';

    if (customerEmail) {
        await sendOrderConfirmationEmail({
            orderId: session.metadata.orderId,
            customerEmail,
            customerName,
            totalAmount: session.amount_total ? session.amount_total / 100 : 0
        });
    }

    // Handle stock decrement
    const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity, variant_id")
        .eq("order_id", session.metadata.orderId);

    if (items) {
        for (const item of items) {
            if (item.variant_id) {
                await supabaseAdmin.rpc('decrement_variant_stock', {
                    v_id: item.variant_id,
                    amount: item.quantity
                });
            } else {
                await supabaseAdmin.rpc('decrement_product_stock', {
                    p_id: item.product_id,
                    amount: item.quantity
                });
            }
        }
    }
}
