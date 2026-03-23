import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    try {
        const { items, shippingOption } = await req.json();

        // ✅ Basic validation
        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        if (!shippingOption || !["standard", "express"].includes(shippingOption)) {
            return NextResponse.json({ error: "Invalid shipping option" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // ✅ Fetch products
        const itemIds = items.map((i: any) => i.productId);

        const { data: dbProducts } = await supabase
            .from("products")
            .select("id, title, base_price, sale_price, on_sale, stock, weight_oz")
            .in("id", itemIds);

        if (!dbProducts || dbProducts.length !== items.length) {
            return NextResponse.json(
                { error: "Some products are invalid or unavailable" },
                { status: 400 }
            );
        }

        // ✅ Fetch variants
        const variantIds = items
            .filter((i: any) => i.variantId)
            .map((i: any) => i.variantId);

        let dbVariants: any[] = [];

        if (variantIds.length > 0) {
            const { data } = await supabase
                .from("product_variants")
                .select("id, name, price_override, weight")
                .in("id", variantIds);

            dbVariants = data || [];
        }

        // ✅ Validate + lock pricing + stock + weight
        const validatedItems = items.map((item: any) => {
            const product = dbProducts.find((p: any) => p.id === item.productId);
            if (!product) throw new Error("Invalid product");

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.title}`);
            }

            const variant = dbVariants.find((v: any) => v.id === item.variantId);

            let price = product.base_price || 0;
            if (variant?.price_override != null) price = variant.price_override;
            if (product.on_sale && product.sale_price != null) price = product.sale_price;

            const name = variant?.name
                ? `${product.title} - ${variant.name}`
                : product.title;

            return {
                ...item,
                name,
                price: Number(price),
                variant_weight_oz: variant?.weight ? Number(variant.weight) : null,
                product_weight_oz: product?.weight_oz ? Number(product.weight_oz) : null,
            };
        });

        const { calculateTotalWeightLb, calculateShippingRate } = await import("@/lib/utils/shippo");
        const totalWeightLb = calculateTotalWeightLb(validatedItems);

        // ✅ Subtotal
        const subtotal = validatedItems.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
        );

        // ✅ Shipping config
        const { data: shippingConfig } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "shipping_settings")
            .maybeSingle();

        const cfg = shippingConfig?.setting_value || {};
        const ship = calculateShippingRate(totalWeightLb, subtotal, cfg, shippingOption);

        const shippingCost = ship.cost;
        const shippingDisplayName = ship.name;
        const minDays = ship.minDays;
        const maxDays = ship.maxDays;

        // ✅ Create pending order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                customer_email: "pending@stripe",
                amount_total: subtotal + shippingCost,
                shipping_address: null,
                metadata: {
                    shipping_option: shippingOption,
                },
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("Order creation failed:", orderError);
            return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
        }

        const SITE_URL =
            process.env.NEXT_PUBLIC_SITE_URL || "https://dinacosmetic.store";

        // ✅ Stripe line items
        const lineItems = validatedItems.map((item: any) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                    metadata: {
                        product_id: item.productId,
                        variant_id: item.variantId || "",
                    },
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const countries = [
            "US","CA","GB","AU","NZ","FR","DE","ES","IT","NL","BE","SE","NO","DK","FI",
            "JP","KR","SG","MY","PH","TH","VN","IN","AE","SA"
        ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

        // ✅ Create Stripe session (IDEMPOTENT)
        const session = await stripe.checkout.sessions.create(
            {
                payment_method_types: ["card"],
                mode: "payment",
                line_items: lineItems,

                billing_address_collection: "required",

                shipping_address_collection: {
                    allowed_countries: countries,
                },

                phone_number_collection: { enabled: true },

                shipping_options: [
                    {
                        shipping_rate_data: {
                            type: "fixed_amount",
                            fixed_amount: {
                                amount: Math.round(shippingCost * 100),
                                currency: "usd",
                            },
                            display_name: shippingDisplayName,
                            delivery_estimate: {
                                minimum: { unit: "business_day", value: minDays },
                                maximum: { unit: "business_day", value: maxDays },
                            },
                        },
                    },
                ],

                success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${SITE_URL}/shop`,

                automatic_tax: { enabled: true },

                expires_at: Math.floor(Date.now() / 1000) + 1800,

                metadata: {
                    order_id: order.id,
                    shipping_option: shippingOption,
                    subtotal: subtotal.toFixed(2),
                    shipping_cost: shippingCost.toFixed(2),
                    items: JSON.stringify(
                        validatedItems.map((i: any) => ({
                            product_id: i.productId,
                            variant_id: i.variantId || null,
                            quantity: i.quantity,
                            price: i.price,
                        }))
                    ),
                },
            },
            {
                idempotencyKey: `checkout_${order.id}`,
            }
        );

        console.log("Checkout session created:", {
            orderId: order.id,
            total: subtotal + shippingCost,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}