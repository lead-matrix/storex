import Stripe from 'stripe';

// NOTE: '2026-02-25.clover' IS the correct API version for the installed stripe@20.4.1.
// This MUST match the apiVersion in:
//   - services/checkoutService.ts
//   - services/orderService.ts
//   - app/api/webhook/stripe/route.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
});
