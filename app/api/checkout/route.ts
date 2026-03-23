import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    try {
        const { items, address, selectedRateId } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Fetch real prices & weights from database (Rule #15: Never trust client price)
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

            // If variants exist, they override the base price.
            if (variant?.price_override != null) {
                price = variant.price_override;
            }

            // However, SALE overrides EVERYTHING according to the new rule
            if (product?.on_sale && product?.sale_price != null) {
                price = product.sale_price;
            }

            // Default all logic to pounds for weight metrics
            let weightLb = 1; // Default to 1 LB if missing
            if (variant?.weight && Number(variant.weight) > 0) {
                weightLb = Number(variant.weight) / 16; // OZ to LBs
            } else if (product?.weight_grams && Number(product.weight_grams) > 0) {
                weightLb = Number(product.weight_grams) / 16; // OZ to LBs
            }

            const serverName = variant && variant.name
                ? `${product?.title || 'Product'} - ${variant.name}`
                : (product?.title || item.name || 'Unknown Product');

            return {
                ...item,
                name: serverName,
                price: Number(price),
                weightLb: Number(weightLb)
            };
        });

        const subtotal = validatedItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
        const totalWeightLb = validatedItems.reduce((acc: number, item: any) => acc + item.weightLb * item.quantity, 0);

        // Determine Shipping Cost securely
        let shippingCost = 9.99;
        let shippingDisplayName = "Standard Flat Rate Shipping (3-5 Days)";
        let minDays = 3;
        let maxDays = 5;

        if (selectedRateId === 'standard_fallback' || selectedRateId === 'express_fallback') {
            const { data: shippingConfig } = await supabase
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', 'shipping_settings')
                .maybeSingle();

            const cfg = shippingConfig?.setting_value || {};
            if (selectedRateId === 'express_fallback') {
                shippingCost = parseFloat(cfg.express_rate ?? '19.99');
                shippingDisplayName = cfg.express_label || 'Express Shipping';
                minDays = 1;
                maxDays = 2;
            } else {
                shippingCost = parseFloat(cfg.standard_rate ?? '7.99');
                shippingDisplayName = cfg.standard_label || 'Standard Shipping';
            }
        } else if (selectedRateId) {
            try {
                const { shippo } = await import('@/lib/shippo');
                const rate = await shippo.rates.get(selectedRateId);
                shippingCost = parseFloat(rate.amount);
                shippingDisplayName = `${rate.provider} - ${rate.servicelevel?.name || 'Standard'}`;
                if (rate.estimatedDays || (rate as any).days) {
                    minDays = (rate.estimatedDays || (rate as any).days) - 1 || 3;
                    maxDays = rate.estimatedDays || (rate as any).days || 5;
                }
            } catch (err) {
                console.error("Failed to verify Shippo rate in checkout:", err);
                // Fallback logic
                shippingCost = totalWeightLb > 2.0 ? 9.99 : totalWeightLb >= 0.5 ? 8.00 : 5.00;
            }
        } else {
            // Extreme fallback if no rate provided
            shippingCost = totalWeightLb > 2.0 ? 9.99 : totalWeightLb >= 0.5 ? 8.00 : 5.00;
        }

        // Apply free domestic shipping logic if threshold met (configurable from admin settings)
        const { data: shippingSettingsRow } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'shipping_settings')
            .maybeSingle();

        const freeShippingThreshold = parseFloat(
            (shippingSettingsRow?.setting_value as any)?.free_shipping_threshold ?? '100'
        );

        if (subtotal >= freeShippingThreshold && shippingCost <= 15) {
            shippingCost = 0;
            shippingDisplayName = `Free ${shippingDisplayName}`;
        }

        // Removed deprecated client rate selections since Stripe handles UI now

        // 2. Create pending order in DB first
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                customer_email: address?.email || "pending@checkout.local",
                amount_total: subtotal + shippingCost,
                shipping_address: address ? address : null
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("DB Order Error:", orderError);
            return NextResponse.json({ error: "Could not create order in database" }, { status: 500 });
        }

        // 3. Create Stripe line items
        const lineItems = validatedItems.map((item: any) => {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dinacosmetic.store';
            const imageUrl = item.image
                ? (item.image.startsWith('http') ? item.image : `${baseUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
                : undefined;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: imageUrl ? [imageUrl] : [],
                        metadata: {
                            product_id: item.productId,
                        },
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        // 3. Create Stripe Checkout Session
        // We pass the wide array of country codes to support worldwide shipping in Stripe
        const worldwideCountries = ["US", "CA", "GB", "AU", "NZ", "IE", "ZA", "FR", "DE", "ES", "IT", "CH", "SE", "NO", "DK", "FI", "NL", "BE", "AT", "PT", "MX", "BR", "AR", "CL", "JP", "KR", "SG", "MY", "PH", "ID", "IN", "TH", "VN", "CN", "TW", "HK", "AE", "SA", "QA", "IL", "TR", "EG", "MA", "NG", "KE", "ZA", "GR", "PL", "CZ", "HU", "RO", "BG", "HR", "SK", "SI", "EE", "LV", "LT", "IS", "CY", "MT"] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
            billing_address_collection: "auto",
            shipping_address_collection: {
                allowed_countries: worldwideCountries,
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: Math.round(shippingCost * 100),
                            currency: 'usd',
                        },
                        display_name: shippingDisplayName,
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: minDays,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: maxDays,
                            },
                        },
                    },
                },
            ],
            metadata: {
                order_id: order.id,
                items: JSON.stringify(validatedItems.map((i: any) => ({
                    product_id: i.productId,
                    variant_id: i.variantId || null,
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
