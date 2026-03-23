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

    // Idempotency check — do NOT log yet
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

            const shipping = session.shipping_details;
            const customer = session.customer_details;
            const orderId = session.metadata?.order_id;

            if (!orderId) {
                console.error("No order_id in session metadata:", session.id);
                throw new Error("Missing order_id in Stripe session metadata");
            }

            // Update order with full data collected by Stripe
            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    status: "paid",
                    fulfillment_status: "unfulfilled",
                    customer_email: customer?.email || "",
                    customer_name: shipping?.name || customer?.name || "",
                    customer_phone: customer?.phone || null,
                    shipping_address: {
                        name: shipping?.name || customer?.name || "",
                        line1: shipping?.address?.line1 || "",
                        line2: shipping?.address?.line2 || "",
                        city: shipping?.address?.city || "",
                        state: shipping?.address?.state || "",
                        postal_code: shipping?.address?.postal_code || "",
                        country: shipping?.address?.country || "US",
                    },
                    billing_address: {
                        name: customer?.name || "",
                        email: customer?.email || "",
                        line1: customer?.address?.line1 || "",
                        city: customer?.address?.city || "",
                        state: customer?.address?.state || "",
                        postal_code: customer?.address?.postal_code || "",
                        country: customer?.address?.country || "US",
                    },
                    amount_total: session.amount_total ? session.amount_total / 100 : 0,
                })
                .eq("id", orderId);

            if (updateError) {
                console.error("Order update failed:", updateError);
                throw new Error(`Order update error: ${updateError.message}`);
            }

            // Create order_items from metadata
            if (cartItems.length > 0) {
                const orderItemsToInsert = cartItems.map((item: any) => ({
                    order_id: orderId,
                    product_id: item.product_id,
                    variant_id: item.variant_id || null,
                    quantity: item.quantity,
                    price: item.price,
                    fulfilled_quantity: 0,
                }));

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(orderItemsToInsert);

                if (itemsError) {
                    console.error("order_items insert failed:", itemsError);
                    // Non-fatal — order is paid, items can be added manually
                }
            }

            // Log event — proves processing was successful
            await supabase.from("stripe_events").insert({
                id: event.id,
                type: event.type,
                data: event.data.object as any,
            }).throwOnError();

            const email = customer?.email;
            const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

            if (orderId && email) {
                try {
                    const { sendOrderConfirmationEmail } = await import("@/lib/utils/email");
                    await sendOrderConfirmationEmail({
                        orderId,
                        customerEmail: email,
                        customerName: customer?.name || "Valued Client",
                        totalAmount: amountTotal,
                        items: cartItems,
                    });
                } catch (emailErr: any) {
                    console.error("Failed to send order confirmation email:", emailErr);
                }
            }
        } else {
            // Non-checkout events — log immediately
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
