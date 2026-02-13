import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error("Missing STRIPE_SECRET_KEY");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-01-27-acacia' as any,
        });

        const formData = await req.formData();
        const priceId = formData.get('priceId') as string;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login?callback=/membership', req.url));
        }

        if (!priceId) {
            return NextResponse.json({ error: "Missing Price ID" }, { status: 400 });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/membership`,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    userId: user.id
                }
            }
        });

        if (!session.url) {
            throw new Error("Failed to create Stripe session URL");
        }

        return NextResponse.redirect(session.url, { status: 303 });
    } catch (error: any) {
        console.error("Stripe Subscription Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
