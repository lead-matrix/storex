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

        // Retrieve order_id and cart_items from metadata
        const orderId = session.metadata?.order_id;
        const email = session.customer_details?.email || session.customer_email;
        const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

        console.log(`Order paid: ${orderId} by ${email}`);

        if (orderId && email) {
            // 1. Update order status and attach email
            const { error: updateError } = await supabase
                .from("orders")
                .update({ status: "paid", customer_email: email, amount_total: amountTotal })
                .eq("id", orderId);

            if (updateError) {
                console.error("Failed to update order status:", updateError);
            }

            // 2. Parse items and deduct inventory
            const cartItemsStr = session.metadata?.cart_items;
            let items: any[] = [];

            if (cartItemsStr) {
                try {
                    items = JSON.parse(cartItemsStr);

                    // Insert order_items
                    const itemsToInsert = items.map((item: any) => ({
                        order_id: orderId,
                        variant_id: item.variant_id || item.product_id,
                        quantity: item.quantity,
                        price: item.price
                    }));

                    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
                    if (itemsError) console.error("Failed to insert items:", itemsError);

                    // Deduct stock natively in Supabase (or here iteratively)
                    for (const item of items) {
                        const variantId = item.variant_id;
                        if (variantId && variantId !== item.product_id) {
                            const { data: v } = await supabase.from("variants").select("stock").eq("id", variantId).single();
                            if (v && typeof v.stock === 'number') {
                                await supabase.from("variants").update({ stock: Math.max(0, v.stock - item.quantity) }).eq("id", variantId);
                            }
                        } else {
                            const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
                            if (prod && typeof prod.stock === 'number') {
                                await supabase.from("products").update({ stock: Math.max(0, prod.stock - item.quantity) }).eq("id", item.product_id);
                            }
                        }
                    }

                } catch (e) {
                    console.error("Error processing cart items:", e);
                }
            }

            // 3. Fire Resend Email
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
