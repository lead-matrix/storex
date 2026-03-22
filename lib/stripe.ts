import Stripe from 'stripe';

// Single canonical API version — must match the webhook handler in app/api/webhook/stripe/route.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
});
