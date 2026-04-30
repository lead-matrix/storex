import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public route — returns shipping settings for the checkout page
export async function POST(req: Request) {
    try {
        const { items } = await req.json();
        const supabase = await createClient();
        const { data: cfg, error: rpcError } = await supabase.rpc('get_shipping_config');

        if (rpcError) {
            console.error('[Shipping Settings] RPC Error:', rpcError)
        }

        // Guard: RPC may return null if no shipping config row exists yet.
        // Fall back to safe defaults so the checkout page never crashes.
        if (!cfg) {
            return NextResponse.json({
                settings: {
                    standard_rate: '7.99',
                    express_rate: '29.99',
                    standard_label: 'Standard Shipping',
                    express_label: 'Express Shipping',
                    free_shipping_threshold: '100',
                }
            })
        }

        let standard_rate = parseFloat(cfg.standard_rate ?? "7.99");
        let express_rate = parseFloat(cfg.express_rate ?? "29.99");

        if (items && items.length > 0) {
            // Fetch weights for these specific items
            const productIds = items.map((i: any) => i.productId);
            const variantIds = items.filter((i: any) => i.variantId).map((i: any) => i.variantId);

            const { data: dbProducts } = await supabase
                .from("products")
                .select("id, weight_oz")
                .in("id", productIds);

            const { data: dbVariants } = variantIds.length > 0 
                ? await supabase.from("product_variants").select("id, weight").in("id", variantIds)
                : { data: [] };

            const itemsWithWeight = items.map((item: any) => {
                const product = dbProducts?.find(p => p.id === item.productId);
                const variant = dbVariants?.find(v => v.id === item.variantId);
                return {
                    quantity: item.quantity,
                    variant_weight_oz: variant?.weight ? Number(variant.weight) : null,
                    product_weight_oz: product?.weight_oz ? Number(product.weight_oz) : null
                };
            });

            const { calculateTotalWeightLb, calculateShippingRate } = await import("@/lib/utils/shippo");
            const totalWeightLb = calculateTotalWeightLb(itemsWithWeight);
            const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

            // Get standard rate from brackets
            const ship = calculateShippingRate(totalWeightLb, subtotal, cfg, 'standard');
            standard_rate = ship.cost;
            const exprShip = calculateShippingRate(totalWeightLb, subtotal, cfg, 'express');
            express_rate = exprShip.cost;
        }

        const settings = {
            standard_rate: standard_rate.toString(),
            express_rate: express_rate.toString(),
            standard_label: cfg.standard_label ?? "USPS Ground Advantage (3-5 Days)",
            express_label: cfg.express_label ?? "USPS Priority Mail (1-3 Days)",
            free_shipping_threshold: cfg.free_shipping_threshold ?? "100",
        };

        return NextResponse.json({ settings });
    } catch (err: any) {
        return NextResponse.json({
            settings: {
                standard_rate: "7.99",
                express_rate: "29.99",
                standard_label: "Standard Shipping",
                express_label: "Express Shipping",
                free_shipping_threshold: "100",
            }
        });
    }
}
