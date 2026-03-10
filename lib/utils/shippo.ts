// Note: Shippo is imported dynamically inside the function to avoid build-time constructor errors.

export async function createShippingLabel(order: any) {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) {
        console.warn("SHIPPO_API_KEY is missing");
        return { tracking_number: "SHP-DEBUG", label_url: "#", status: "PENDING" };
    }

    try {
        // Dynamic import to handle constructor issues in different build environments
        const ShippoModule = await import('shippo');
        // @ts-ignore
        const Shippo = ShippoModule.default || ShippoModule;

        let shippo: any;
        if (typeof Shippo === 'function') {
            try {
                shippo = new (Shippo as any)(apiKey);
            } catch (e) {
                shippo = (Shippo as any)(apiKey);
            }
        } else {
            throw new Error("Shippo is not a constructor or function");
        }

        // 1. Fetch Warehouse Info from Site Settings
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'warehouse_info')
            .maybeSingle();

        const warehouse = settings?.setting_value || {
            name: "DINA COSMETIC | The Obsidian Palace",
            street1: "2417 Galveston Rd",
            city: "Houston",
            state: "TX",
            zip: "77017",
            country: "US",
            phone: "+12816877609",
            email: "support@dinacosmetic.store"
        };

        const shipment = await shippo.shipment.create({
            address_from: warehouse,
            address_to: {
                name: order.shipping_address?.name || "Valued client",
                street1: order.shipping_address?.address?.line1 || order.shipping_address?.line1,
                street2: order.shipping_address?.address?.line2 || order.shipping_address?.line2,
                city: order.shipping_address?.address?.city || order.shipping_address?.city,
                state: order.shipping_address?.address?.state || order.shipping_address?.state,
                zip: order.shipping_address?.address?.postal_code || order.shipping_address?.zip,
                country: order.shipping_address?.address?.country || order.shipping_address?.country || "US",
            },
            parcels: [{
                length: warehouse.parcel_l || "8",
                width: warehouse.parcel_w || "6",
                height: warehouse.parcel_h || "4",
                distance_unit: "in",
                weight: warehouse.parcel_wt || "1",
                mass_unit: "lb",
            }],
            async: false,
        });

        const rate = shipment.rates[0];
        const transaction = await shippo.transaction.create({
            rate: rate.object_id,
            label_file_type: "PDF",
            async: false,
        });

        return {
            tracking_number: transaction.tracking_number,
            label_url: transaction.label_url,
            status: transaction.status,
        };
    } catch (error) {
        console.error("Shippo Error:", error);
        throw error;
    }
}
