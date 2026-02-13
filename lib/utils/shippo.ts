import Shippo from 'shippo';

// Handle both constructor and function-style initialization
const getShippo = () => {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) return {} as any; // Fallback for build phase

    return (Shippo as any).default
        ? new (Shippo as any).default(apiKey)
        : typeof Shippo === 'function'
            ? (Shippo as any)(apiKey)
            : new (Shippo as any)(apiKey);
};

const shippo = getShippo();

export async function createShippingLabel(order: any) {
    try {
        const shipment = await shippo.shipment.create({
            address_from: {
                name: "DINA COSMETIC | The Obsidian Palace",
                street1: "123 Luxury Lane",
                city: "Beverly Hills",
                state: "CA",
                zip: "90210",
                country: "US",
            },
            address_to: {
                name: order.shipping_address?.name || "Valued client",
                street1: order.shipping_address?.address?.line1,
                city: order.shipping_address?.address?.city,
                state: order.shipping_address?.address?.state,
                zip: order.shipping_address?.address?.postal_code,
                country: order.shipping_address?.address?.country,
            },
            parcels: [{
                length: "10",
                width: "5",
                height: "5",
                distance_unit: "in",
                weight: "2",
                mass_unit: "lb",
            }],
            async: false,
        });

        // Automatically pick the cheapest rate for demo purpose, or "best" rate
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
