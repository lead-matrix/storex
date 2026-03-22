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

        let shippingCost = 9.99;
        let shippingDisplayName = "Standard Flat Rate Shipping (3-5 Days)";

        if (subtotal >= 100) {
            shippingCost = 0;
            shippingDisplayName = "Free Shipping (Standard)";
        } else if (totalWeightLb < 0.5) {
            shippingCost = 5.00;
            shippingDisplayName = "Small Package Shipping (3-5 Days)";
        } else if (totalWeightLb <= 2.0) {
            shippingCost = 8.00;
            shippingDisplayName = "Medium Package Shipping (3-5 Days)";
        } else {
            shippingCost = 9.99;
            shippingDisplayName = "Standard Package Shipping (3-5 Days)";
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
                                value: 3,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 5,
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
