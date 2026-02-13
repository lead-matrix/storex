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

            // Case A: Subscription Created (Checkout Session Completed)
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription' && session.subscription) {
                    await handleSubscriptionCreated(session, stripe);
                } else if (session.mode === 'payment') {
                    // Handle one-time product purchase fulfillment here
                    await handleOneTimePayment(session);
                }
                break;
            }

            // Case B: Subscription Updated (Renewals, Cancellations, Plan Changes)
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            // Case C: Payment Failed (Churn Prevention)
            case 'invoice.payment_failed': {
                // const invoice = event.data.object as Stripe.Invoice;
                // Logic: Email user, mark subscription as 'past_due' in DB
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

async function handleSubscriptionCreated(session: Stripe.Checkout.Session, stripe: Stripe) {
    const subscriptionId = session.subscription as string;
    const userId = session.metadata?.userId;

    if (!userId) {
        console.error('Missing userId in session metadata');
        return;
    }

    // Retrieve full subscription details from Stripe to get dates
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

    // Upsert into Supabase
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        });

    if (error) throw error;
    console.log(`✅ Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const s = subscription as any;
    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
            status: s.status,
            current_period_start: new Date(s.current_period_start * 1000).toISOString(),
            current_period_end: new Date(s.current_period_end * 1000).toISOString(),
            cancel_at_period_end: s.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', s.id);

    if (error) throw error;
    console.log(`✅ Subscription updated: ${subscription.id} is now ${subscription.status}`);
}

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

    // Also handle stock decrement here if not handled elsewhere
    // Fetch order items using supabaseAdmin
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
