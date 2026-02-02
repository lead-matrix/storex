import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
    apiVersion: "2025-01-27-acacia" as any,
});

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

        // Mock response if Stripe keys are missing
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({
                url: "/checkout/success",
                mock: true,
                message: "Stripe key missing. Simulated success redirect."
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
            metadata: {
                userId: (await supabase.auth.getUser()).data.user?.id || "guest",
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
