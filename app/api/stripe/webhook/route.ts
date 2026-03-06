import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
    const body = await req.text();

    const signature = headers().get("stripe-signature")!;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        return NextResponse.json({ error: "Webhook error" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("Order paid:", session.id);
    }

    return NextResponse.json({ received: true });
}
