import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { address, items } = await req.json();

        if (!address || !items || items.length === 0) {
            return NextResponse.json({ error: "Address and items required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Calculate total weight in ounces
        // NOTE: weight_grams column now stores oz directly (updated product form uses oz)
        let totalWeightOz = 0;

        for (const item of items) {
            let itemWeightOz = 0;

            if (item.variantId) {
                const { data: v } = await supabase.from('product_variants').select('weight').eq('id', item.variantId).single();
                if (v && v.weight) itemWeightOz = Number(v.weight); // variant weight is in oz
            }

            // Fallback to product weight_grams field (now stores oz directly)
            if (!itemWeightOz || itemWeightOz <= 0) {
                const { data: p } = await supabase.from('products').select('weight_grams').eq('id', item.productId).single();
                if (p && p.weight_grams) {
                    itemWeightOz = Number(p.weight_grams); // stored as oz
                }
            }

            // Default to 2 oz if no weight specified
            if (!itemWeightOz || itemWeightOz <= 0) {
                itemWeightOz = 2;
            }

            totalWeightOz += itemWeightOz * item.quantity;
        }

        const totalWeightLb = totalWeightOz / 16;
        const shippoUtils = await import('@/lib/utils/shippo');
        const parcel = shippoUtils.getParcelForWeight(totalWeightLb);

        const apiKey = process.env.SHIPPO_API_KEY;
        if (!apiKey) {
            // Fetch admin-configured fallback rates from settings
            const { data: shippingConfig } = await supabase
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', 'shipping_settings')
                .maybeSingle();

            const cfg = shippingConfig?.setting_value || {};
            const standardRate = String(cfg.standard_rate ?? '7.99');
            const expressRate = String(cfg.express_rate ?? '19.99');
            const standardLabel = cfg.standard_label || 'Standard Shipping';
            const expressLabel = cfg.express_label || 'Express Shipping';

            return NextResponse.json({
                rates: [
                    {
                        object_id: "standard_fallback",
                        provider: "USPS",
                        provider_image_75: "",
                        servicelevel: { name: standardLabel },
                        amount: standardRate,
                        days: 5
                    },
                    {
                        object_id: "express_fallback",
                        provider: "USPS",
                        provider_image_75: "",
                        servicelevel: { name: expressLabel },
                        amount: expressRate,
                        days: 2
                    }
                ]
            });
        }

        const { shippo } = await import('@/lib/shippo');

        // Fetch Warehouse Address from site settings
        const { data: settings } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'warehouse_info').maybeSingle();
        const warehouse = settings?.setting_value || {
            name: "Dina Cosmetic",
            street1: "5430 FM 359 Rd S Ste 400 PMB 1013",
            city: "Brookshire",
            state: "TX",
            zip: "77423",
            country: "US",
            phone: "+12816877609",
            email: "dinaecosmetic@gmail.com"
        };

        const targetAddress = {
            name: address.name,
            street1: address.line1,
            street2: address.line2 || "",
            city: address.city,
            state: address.state,
            zip: address.postal_code,
            country: address.country,
            email: address.email || "customer@example.com"
        };

        const shipment = await shippo.shipments.create({
            addressFrom: warehouse,
            addressTo: targetAddress,
            parcels: [parcel]
        });

        const rates = shipment.rates;

        return NextResponse.json({ rates: rates });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch rates';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
