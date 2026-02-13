import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;
const getStripe = () => {
    if (stripeInstance) return stripeInstance;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
        apiVersion: "2025-01-27-acacia" as any,
    });
    return stripeInstance;
};

export async function POST(req: Request) {
    try {
        const { items } = await req.json();
        const supabase = await createClient();

        let subtotal = 0;
        const line_items: any[] = [];

        // Fetch actual prices from Supabase to prevent client-side spoofing
        for (const item of items) {
            // Check if it's a variant
            const { data: variant } = await supabase
                .from("variants")
                .select("id, product_id, price_override, name, products(name, images)")
                .eq("id", item.id)
                .single();

            let price = 0;
            let name = "";
            let image = "";

            if (variant) {
                price = variant.price_override;
                const productData = Array.isArray(variant.products) ? variant.products[0] : variant.products;
                const productName = (productData as any)?.name || "Product";
                const variantName = (variant as any).name || "Standard Edition";
                name = `${productName} — ${variantName}`;
                image = (productData as any)?.images?.[0] || "";
            } else {
                // Fallback to product
                const { data: product } = await supabase
                    .from("products")
                    .select("name, base_price, images")
                    .eq("id", item.id)
                    .single();

                if (!product) continue;
                price = product.base_price;
                name = product.name;
                image = product.images?.[0] || "";
            }

            subtotal += price * item.quantity;

            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: name,
                        images: image ? [image] : [],
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: item.quantity,
            });
        }

        // Tax (8%)
        const taxRate = 0.08;
        const taxAmount = subtotal * taxRate;

        // Shipping ($10, free if > $75)
        const shippingAmount = subtotal >= 75 ? 0 : 10;

        // Add Tax and Shipping as line items for Stripe
        if (taxAmount > 0) {
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Sales Tax (8%)",
                    },
                    unit_amount: Math.round(taxAmount * 100),
                },
                quantity: 1,
            });
        }

        if (shippingAmount > 0) {
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Shipping",
                    },
                    unit_amount: Math.round(shippingAmount * 100),
                },
                quantity: 1,
            });
        }

        // Create Pending Order in Supabase
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || null;

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: userId,
                total_amount: subtotal + taxAmount + shippingAmount,
                tax_amount: taxAmount,
                shipping_amount: shippingAmount,
                status: "pending",
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert Order Items
        const orderItems = items.map((item: any) => {
            const lineItem = line_items.find(li => li.price_data.product_data.name.includes(item.name) || li.price_data.product_data.name === item.name);
            return {
                order_id: order.id,
                product_id: item.productId || item.id,
                variant_id: item.productId ? item.id : null,
                quantity: item.quantity,
                price: (lineItem?.price_data.unit_amount || 0) / 100,
            };
        });

        await supabase.from("order_items").insert(orderItems);

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
            metadata: {
                orderId: order.id,
                userId: userId || "guest",
            },
        });

        // Update order with Stripe session ID
        await supabase
            .from("orders")
            .update({ stripe_checkout_id: session.id })
            .eq("id", order.id);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
