import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

// Countries where we ship internationally
const INTL_COUNTRIES = [
    "CA","GB","AU","NZ","FR","DE","ES","IT","NL","BE","SE","NO","DK","FI",
    "JP","KR","SG","MY","PH","TH","VN","IN","AE","SA","MX","BR","ZA","PL","TR",
] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

const ALL_COUNTRIES = ["US", ...INTL_COUNTRIES] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // ─── Fetch & validate products ───────────────────────────────────────
        const itemIds = items.map((i: any) => i.productId);
        const { data: dbProducts } = await supabase
            .from("products")
            .select("id, title, base_price, sale_price, on_sale, stock, weight_oz")
            .in("id", itemIds);

        if (!dbProducts || dbProducts.length === 0) {
            return NextResponse.json({ error: "Some products are invalid or unavailable" }, { status: 400 });
        }

        const variantIds = items.filter((i: any) => i.variantId).map((i: any) => i.variantId);
        let dbVariants: any[] = [];
        if (variantIds.length > 0) {
            const { data } = await supabase
                .from("product_variants")
                .select("id, name, price_override, weight")
                .in("id", variantIds);
            dbVariants = data || [];
        }

        // ─── Lock prices & weight server-side ───────────────────────────────
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

            const name = variant?.name ? `${product.title} — ${variant.name}` : product.title;

            return {
                ...item,
                name,
                price: Number(price),
                variant_weight_oz: variant?.weight ? Number(variant.weight) : null,
                product_weight_oz: product?.weight_oz ? Number(product.weight_oz) : null,
            };
        });

        // ─── Compute weight & subtotal ───────────────────────────────────────
        const { calculateTotalWeightLb, calculateShippingRate } = await import("@/lib/utils/shippo");
        const totalWeightLb = calculateTotalWeightLb(validatedItems);
        const subtotal = validatedItems.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
        );

        // ─── Load shipping config ────────────────────────────────────────────
        const { data: shippingConfig } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "shipping_settings")
            .maybeSingle();

        const cfg = shippingConfig?.setting_value || {};
        const freeThreshold = parseFloat(cfg.free_shipping_threshold ?? "100");
        const isFree = subtotal >= freeThreshold;

        // ─── Build shipping options for Stripe ──────────────────────────────
        // Stripe will show ALL options; the customer picks one.
        // Domestic-oriented options shown first, International last.
        const stdRate = calculateShippingRate(totalWeightLb, subtotal, cfg, "standard");
        const expRate = calculateShippingRate(totalWeightLb, subtotal, cfg, "express");

        // International flat rate (recovers cost for heavy cross-border shipments)
        const intlStandardCost = parseFloat(cfg.international_standard_rate ?? "19.99");
        const intlExpressCost = parseFloat(cfg.international_express_rate ?? "49.99");

        const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
            // Option 1: US Domestic Standard (or FREE)
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: isFree ? 0 : Math.round(stdRate.cost * 100),
                        currency: "usd",
                    },
                    display_name: isFree ? "Free Standard Shipping 🎁" : "Standard Shipping (US)",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 5 },
                        maximum: { unit: "business_day", value: 10 },
                    },
                },
            },
            // Option 2: US Domestic Express
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: Math.round(expRate.cost * 100),
                        currency: "usd",
                    },
                    display_name: "Express Shipping (US) ⚡",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 2 },
                        maximum: { unit: "business_day", value: 4 },
                    },
                },
            },
            // Option 3: International Standard
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: Math.round(intlStandardCost * 100),
                        currency: "usd",
                    },
                    display_name: "International Standard Shipping 🌍",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 10 },
                        maximum: { unit: "business_day", value: 21 },
                    },
                },
            },
            // Option 4: International Express (DHL / Priority)
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: Math.round(intlExpressCost * 100),
                        currency: "usd",
                    },
                    display_name: "International Express (DHL) 🚀",
                    delivery_estimate: {
                        minimum: { unit: "business_day", value: 3 },
                        maximum: { unit: "business_day", value: 7 },
                    },
                },
            },
        ];

        // ─── Create pending order (no email yet – webhook will fill it) ──────
        const estimatedTotal = subtotal + stdRate.cost; // worst case; webhook corrects it
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                customer_email: "pending@stripe",
                amount_total: estimatedTotal,
                shipping_address: null,
                metadata: {
                    weight_lb: totalWeightLb.toFixed(3),
                    subtotal: subtotal.toFixed(2),
                    is_free_shipping: isFree,
                },
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("Order creation failed:", orderError);
            return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
        }

        // ─── Stripe line items ───────────────────────────────────────────────
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

        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dinacosmetic.store";

        // ─── Create Stripe session ───────────────────────────────────────────
        const session = await stripe.checkout.sessions.create(
            {
                payment_method_types: ["card"],
                mode: "payment",
                line_items: lineItems,

                // Customer enters email, name, shipping address ONCE inside Stripe
                customer_creation: "always",
                billing_address_collection: "auto",
                shipping_address_collection: {
                    allowed_countries: ALL_COUNTRIES,
                },
                phone_number_collection: { enabled: true },

                // Stripe shows ALL options — customer picks the one that fits their location
                shipping_options: shippingOptions,

                success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${SITE_URL}/shop`,

                automatic_tax: { enabled: true },
                expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min

                metadata: {
                    order_id: order.id,
                    subtotal: subtotal.toFixed(2),
                    weight_lb: totalWeightLb.toFixed(3),
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

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}