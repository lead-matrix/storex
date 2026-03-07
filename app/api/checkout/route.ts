import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover", // Use standard latest api version
});

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        // Use service-role admin client so guest (unauthenticated) checkouts
        // are not blocked by RLS when inserting the pending order.
        const supabase = await createAdminClient();

        // 1. Calculate shipping & tax (for Stripe, we pass them as line items or shipping options)
        const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
        const FREE_SHIPPING_THRESHOLD = 100;
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99;

        // 2. We should ideally create a DB order first, to attach its ID to Stripe metadata
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                amount_total: subtotal + shipping, // We let Stripe compute actual tax via Stripe Tax if needed, but for now fixed
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("DB Order Error:", orderError);
            return NextResponse.json({ error: "Could not create order in database" }, { status: 500 });
        }

        // 3. Create Stripe line items
        const lineItems = items.map((item: any) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                    images: [item.image],
                    metadata: {
                        product_id: item.productId,
                    },
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // Add shipping as a line item for simplicity, or use Stripe shipping_options
        const shippingOptions = shipping > 0 ? [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: { amount: Math.round(shipping * 100), currency: "usd" },
                    display_name: "Standard Shipping",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 3 },
                        maximum: { unit: "business_day", value: 5 },
                    },
                },
            }
        ] : [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: { amount: 0, currency: "usd" },
                    display_name: "Free Shipping",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 3 },
                        maximum: { unit: "business_day", value: 5 },
                    },
                },
            }
        ];

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=true`,
            billing_address_collection: "required",
            shipping_address_collection: {
                allowed_countries: ["US", "CA", "GB"],
            },
            shipping_options: shippingOptions as Stripe.Checkout.SessionCreateParams.ShippingOption[],
            metadata: {
                order_id: order.id,
                // Serialize cart to json so webhook can create order_items easily
                cart_items: JSON.stringify(items.map((i: any) => ({
                    product_id: i.productId,
                    variant_id: i.variantId ?? i.id !== i.productId ? i.id : null,
                    quantity: i.quantity,
                    price: i.price,
                }))),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("Checkout Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
