export function getParcelForWeight(totalWeightLb: number) {
    if (totalWeightLb < 0.5) {
        // Small poly mailer
        return {
            length: "9",
            width: "6",
            height: "1",
            distanceUnit: "in" as any,
            weight: Math.max(0.1, totalWeightLb).toFixed(2),
            massUnit: "lb" as any
        };
    } else if (totalWeightLb <= 2) {
        // Medium poly mailer
        return {
            length: "12",
            width: "9",
            height: "2",
            distanceUnit: "in" as any,
            weight: totalWeightLb.toFixed(2),
            massUnit: "lb" as any
        };
    } else {
        // Box template
        return {
            length: "12",
            width: "10",
            height: "6",
            distanceUnit: "in" as any,
            weight: totalWeightLb.toFixed(2),
            massUnit: "lb" as any
        };
    }
}

export async function createShippingLabel(order: any) {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) {
        console.warn("SHIPPO_API_KEY is missing");
        return { tracking_number: "SHP-DEBUG", label_url: "#", status: "PENDING" };
    }

    try {
        const ShippoModule = await import('shippo');
        const Shippo = ShippoModule.Shippo || (ShippoModule as any).default?.Shippo || ShippoModule.default || ShippoModule;
        const shippo = new Shippo({
            apiKeyHeader: apiKey,
            shippoApiVersion: "2026-03-01",
        });

        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Calculate items weight
        let totalWeightOz = 0;
        const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', order.id);

        if (orderItems) {
            for (const item of orderItems) {
                let itemWeightOz = 0;
                if (item.variant_id) {
                    const { data: v } = await supabase.from('product_variants').select('weight').eq('id', item.variant_id).single();
                    if (v?.weight) itemWeightOz = Number(v.weight);
                }

                if (!itemWeightOz || itemWeightOz <= 0) {
                    const { data: p } = await supabase.from('products').select('weight_grams').eq('id', item.product_id).single();
                    if (p?.weight_grams) itemWeightOz = Number(p.weight_grams) / 28.3495;
                }

                if (!itemWeightOz || itemWeightOz <= 0) itemWeightOz = 2; // default
                totalWeightOz += itemWeightOz * (item.quantity || 1);
            }
        }

        const parcel = getParcelForWeight(totalWeightOz / 16);

        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'warehouse_info')
            .maybeSingle();

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

        const shipment = await shippo.shipments.create({
            addressFrom: warehouse,
            addressTo: {
                name: order.shipping_address?.name || "Valued client",
                street1: order.shipping_address?.address?.line1 || order.shipping_address?.line1,
                street2: order.shipping_address?.address?.line2 || order.shipping_address?.line2,
                city: order.shipping_address?.address?.city || order.shipping_address?.city,
                state: order.shipping_address?.address?.state || order.shipping_address?.state,
                zip: order.shipping_address?.address?.postal_code || order.shipping_address?.zip,
                country: order.shipping_address?.address?.country || order.shipping_address?.country || "US",
            },
            parcels: [parcel]
        });

        const rate = shipment.rates[0];
        const transaction = await shippo.transactions.create({
            rate: rate.objectId,
            labelFileType: "PDF"
        });

        return {
            tracking_number: transaction.trackingNumber,
            label_url: transaction.labelUrl,
            status: transaction.status,
        };
    } catch (error) {
        console.error("Shippo Error:", error);
        throw error;
    }
}
