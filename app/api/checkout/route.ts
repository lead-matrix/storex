import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    try {
        const { items, shippingOption } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        if (!shippingOption || !["standard", "express"].includes(shippingOption)) {
            return NextResponse.json({ error: "Invalid shipping option" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Validate items against DB — never trust client prices
        const itemIds = items.map((i: any) => i.productId);
        const { data: dbProducts } = await supabase
            .from("products")
            .select("id, title, base_price, sale_price, on_sale, weight_grams")
            .in("id", itemIds);

        const variantIds = items.filter((i: any) => i.variantId).map((i: any) => i.variantId);
        let dbVariants: any[] = [];
        if (variantIds.length > 0) {
            const { data } = await supabase
                .from("product_variants")
                .select("id, name, price_override, weight")
                .in("id", variantIds);
            dbVariants = data || [];
        }

        const validatedItems = items.map((item: any) => {
            const product = dbProducts?.find((p: any) => p.id === item.productId);
            const variant = dbVariants.find((v: any) => v.id === item.variantId);

            let price = product?.base_price || 0;
            if (variant?.price_override != null) price = variant.price_override;
            if (product?.on_sale && product?.sale_price != null) price = product.sale_price;

            const serverName = variant?.name
                ? `${product?.title || "Product"} - ${variant.name}`
                : product?.title || item.name || "Unknown Product";

            return {
                ...item,
                name: serverName,
                price: Number(price),
            };
        });

        const subtotal = validatedItems.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
        );

        // 2. Read shipping config from site_settings
        const { data: shippingConfig } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "shipping_settings")
            .maybeSingle();

        const cfg = shippingConfig?.setting_value || {};
        const standardRate = parseFloat(cfg.standard_rate ?? "7.99");
        const expressRate = parseFloat(cfg.express_rate ?? "29.99");
        const standardLabel = cfg.standard_label || "Standard Shipping (5-10 Business Days)";
        const expressLabel = cfg.express_label || "Express Shipping (2-4 Business Days)";
        const freeShippingThreshold = parseFloat(cfg.free_shipping_threshold ?? "100");

        // 3. Determine shipping cost
        let shippingCost: number;
        let shippingDisplayName: string;
        let minDays: number;
        let maxDays: number;

        if (shippingOption === "express") {
            shippingCost = expressRate;
            shippingDisplayName = expressLabel;
            minDays = 2;
            maxDays = 4;
        } else {
            // Standard
            if (subtotal >= freeShippingThreshold) {
                shippingCost = 0;
                shippingDisplayName = "Free Standard Shipping";
            } else {
                shippingCost = standardRate;
                shippingDisplayName = standardLabel;
            }
            minDays = 5;
            maxDays = 10;
        }

        // 4. Create pending order — address will be populated by webhook
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                customer_email: "pending@stripe",
                amount_total: subtotal + shippingCost,
                shipping_address: null,
                metadata: { shipping_option: shippingOption },
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("DB Order Error:", orderError);
            return NextResponse.json({ error: "Could not create order in database" }, { status: 500 });
        }

        // 5. Build Stripe line items
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dinacosmetic.store";

        const lineItems = validatedItems.map((item: any) => {
            const imageUrl = item.image
                ? item.image.startsWith("http")
                    ? item.image
                    : `${SITE_URL}${item.image.startsWith("/") ? "" : "/"}${item.image}`
                : undefined;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: imageUrl ? [imageUrl] : [],
                        metadata: { product_id: item.productId },
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        const worldwideCountries = [
            "US", "CA", "GB", "AU", "NZ", "IE", "ZA", "FR", "DE", "ES", "IT", "CH", "SE",
            "NO", "DK", "FI", "NL", "BE", "AT", "PT", "MX", "BR", "AR", "CL", "JP", "KR",
            "SG", "MY", "PH", "ID", "IN", "TH", "VN", "CN", "TW", "HK", "AE", "SA", "QA",
            "IL", "TR", "EG", "MA", "NG", "KE", "GR", "PL", "CZ", "HU", "RO", "BG", "HR",
            "SK", "SI", "EE", "LV", "LT", "IS", "CY", "MT",
        ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

        // 6. Create Stripe Checkout Session — Stripe collects address + phone
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            billing_address_collection: "required",
            shipping_address_collection: {
                allowed_countries: worldwideCountries,
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
            metadata: {
                order_id: order.id,
                shipping_option: shippingOption,
                items: JSON.stringify(
                    validatedItems.map((i: any) => ({
                        product_id: i.productId,
                        variant_id: i.variantId || null,
                        quantity: i.quantity,
                        price: i.price,
                    }))
                ),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Checkout API error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
