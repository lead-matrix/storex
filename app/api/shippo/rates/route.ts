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
        let totalWeightOz = 0;

        for (const item of items) {
            let itemWeightOz = 0;

            if (item.variantId) {
                const { data: v } = await supabase.from('product_variants').select('weight').eq('id', item.variantId).single();
                if (v && v.weight) itemWeightOz = Number(v.weight);
            }

            // Fallback to base product weight_grams if variant weight is not specified
            if (!itemWeightOz || itemWeightOz <= 0) {
                const { data: p } = await supabase.from('products').select('weight_grams').eq('id', item.productId).single();
                if (p && p.weight_grams) {
                    itemWeightOz = Number(p.weight_grams) / 28.3495; // Convert grams to oz
                }
            }

            // default to 2 oz if neither has weight
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
            // Mock response if API key is not configured for dev
            return NextResponse.json({
                rates: [
                    { object_id: "mock_1", provider: "MockCarrier", provider_image_75: "", servicelevel: { name: "Standard Shipping" }, amount: "9.99", days: 3 },
                    { object_id: "mock_2", provider: "MockCarrier", provider_image_75: "", servicelevel: { name: "Express Shipping" }, amount: "19.99", days: 1 }
                ]
            });
        }

        const ShippoModule = await import('shippo');
        const Shippo = ShippoModule.Shippo || (ShippoModule as any).default?.Shippo || ShippoModule.default || ShippoModule;
        const shippo = new Shippo({
            apiKeyHeader: apiKey,
            shippoApiVersion: "2026-03-01",
        });

        // Fetch Warehouse Address
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

        let targetAddress = {
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
    } catch (err: any) {
        console.error("Rates error:", err);
        return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }
}
