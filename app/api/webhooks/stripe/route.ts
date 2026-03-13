import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { processPaymentSuccess } from '@/services/paymentService';

export async function POST(req: Request) {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`⚠️ Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.payment_status === 'paid') {
                    await processPaymentSuccess(session);
                }
                break;
            }
            case 'payment_intent.succeeded': {
                // Handle standalone intent if needed or handled in checkout.session.completed
                break;
            }
            // Add other event types if necessary
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        // Respond with 500 to trigger Stripe retry logic
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
