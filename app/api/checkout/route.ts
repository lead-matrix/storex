import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover" as any,
});

export async function POST(req: Request) {
    try {
        const { items, address, selectedRateId } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Fetch real prices from database (Rule #15: Never trust client price)
        const itemIds = items.map((i: any) => i.productId);
        const { data: dbProducts } = await supabase
            .from("products")
            .select("id, base_price, sale_price, on_sale")
            .in("id", itemIds);

        const variantIds = items.filter((i: any) => i.variantId).map((i: any) => i.variantId);
        let dbVariants: any[] = [];
        if (variantIds.length > 0) {
            const { data } = await supabase
                .from("product_variants")
                .select("id, price_override")
                .in("id", variantIds);
            dbVariants = data || [];
        }

        const validatedItems = items.map((item: any) => {
            const product = dbProducts?.find((p: any) => p.id === item.productId);
            const variant = dbVariants.find((v: any) => v.id === item.variantId);

            let price = product?.base_price || 0;
            if (product?.on_sale && product?.sale_price) {
                price = product.sale_price;
            }
            if (variant?.price_override != null) {
                price = variant.price_override;
            }

            return {
                ...item,
                price: Number(price)
            };
        });

        const subtotal = validatedItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

        let shipping = 9.99; // Default fallback fallback
        let shippingDisplayName = "Standard Shipping";

        if (selectedRateId && !selectedRateId.startsWith('mock_')) {
            const apiKey = process.env.SHIPPO_API_KEY;
            if (apiKey) {
                const { shippo } = await import('@/lib/shippo');

                try {
                    const rate = await shippo.rates.get(selectedRateId);
                    if (rate && rate.amount) {
                        shipping = parseFloat(rate.amount);
                        shippingDisplayName = `${rate.provider} - ${rate.servicelevel?.name || 'Standard'}`;
                    }
                } catch (e) {
                    console.error("Failed to retrieve Shippo rate precisely:", e);
                }
            }
        } else if (selectedRateId?.startsWith('mock_')) {
            shipping = selectedRateId === 'mock_1' ? 9.99 : 19.99;
            shippingDisplayName = selectedRateId === 'mock_1' ? 'Standard Shipping' : 'Express Shipping';
        }

        // 2. Create pending order in DB first
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                status: "pending",
                customer_email: address?.email || "pending@checkout.local",
                amount_total: subtotal + shipping,
                shipping_address: address ? address : null
            })
            .select("id")
            .single();

        if (orderError) {
            console.error("DB Order Error:", orderError);
            return NextResponse.json({ error: "Could not create order in database" }, { status: 500 });
        }

        // 3. Create Stripe line items
        const lineItems = validatedItems.map((item: any) => ({
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

        const shippingOptions = [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: { amount: Math.round(shipping * 100), currency: "usd" },
                    display_name: shippingDisplayName,
                },
            }
        ];

        // 4. Create Stripe Checkout Session
        // We pass the wide array of country codes to support worldwide shipping in Stripe
        const worldwideCountries = ["US", "CA", "GB", "AU", "NZ", "IE", "ZA", "FR", "DE", "ES", "IT", "CH", "SE", "NO", "DK", "FI", "NL", "BE", "AT", "PT", "MX", "BR", "AR", "CL", "JP", "KR", "SG", "MY", "PH", "ID", "IN", "TH", "VN", "CN", "TW", "HK", "AE", "SA", "QA", "IL", "TR", "EG", "MA", "NG", "KE", "ZA", "GR", "PL", "CZ", "HU", "RO", "BG", "HR", "SK", "SI", "EE", "LV", "LT", "IS", "CY", "MT"] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=true`,
            billing_address_collection: "auto",
            shipping_address_collection: {
                allowed_countries: worldwideCountries,
            },
            customer_email: address?.email,
            shipping_options: shippingOptions as Stripe.Checkout.SessionCreateParams.ShippingOption[],
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
