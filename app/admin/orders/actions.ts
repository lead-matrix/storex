"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// Ensure the caller is an authenticated admin
// Uses the regular server client for cookie-based session resolution,
// then the admin client for the privileged role lookup.
async function ensureAdmin() {
    // Must use the server (anon) client for cookie-based session
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) throw new Error("Authentication required");

    // Use admin client to bypass RLS for role lookup
    const supabase = await createAdminClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Unauthorized");
    return supabase;
}

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

    if (error) throw error;
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
}

export async function generateShippingLabel(orderId: string) {
    const supabase = await ensureAdmin();
    const shippoKey = process.env.SHIPPO_API_KEY;

    if (!shippoKey) throw new Error("Shippo API key not configured. Add SHIPPO_API_KEY to your environment variables.");

    // 1. Fetch the order with shipping address
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");

    const shippingAddr = order.shipping_address as Record<string, string> | null;
    if (!shippingAddr) throw new Error("No shipping address on this order. Customer must complete checkout first.");

    // 2. Create Shippo shipment to get rates
    const shipmentRes = await fetch("https://api.goshippo.com/shipments/", {
        method: "POST",
        headers: {
            Authorization: `ShippoToken ${shippoKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            address_from: {
                name: "Dina Cosmetic",
                street1: "2417 Galveston Rd",
                city: "Houston",
                state: "TX",
                zip: "77017",
                country: "US",
                email: "support@dinacosmetic.store",
                phone: "+12816877609",
            },
            address_to: {
                name: shippingAddr.name ?? order.customer_email ?? "Customer",
                street1: shippingAddr.line1 ?? shippingAddr.street1 ?? "",
                street2: shippingAddr.line2 ?? shippingAddr.street2 ?? "",
                city: shippingAddr.city ?? "",
                state: shippingAddr.state ?? "",
                zip: shippingAddr.postal_code ?? shippingAddr.zip ?? "",
                country: shippingAddr.country ?? "US",
            },
            parcels: [
                {
                    length: "8",
                    width: "6",
                    height: "4",
                    distance_unit: "in",
                    weight: "0.5",
                    mass_unit: "lb",
                },
            ],
            async: false,
        }),
    });

    if (!shipmentRes.ok) {
        const errBody = await shipmentRes.text();
        throw new Error(`Shippo shipment creation failed: ${errBody}`);
    }

    const shipment = await shipmentRes.json();

    if (!shipment.rates || shipment.rates.length === 0) {
        throw new Error("No shipping rates returned by Shippo. Check the shipping address.");
    }

    // 3. Pick the cheapest rate (or USPS if available)
    const rates: Array<{ provider: string; amount: string; object_id: string }> = shipment.rates;
    const preferredRate = rates.find((r) => r.provider === "USPS") ?? rates[0];

    // 4. Purchase the rate to generate the label
    const transactionRes = await fetch("https://api.goshippo.com/transactions/", {
        method: "POST",
        headers: {
            Authorization: `ShippoToken ${shippoKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            rate: preferredRate.object_id,
            label_file_type: "PDF",
            async: false,
        }),
    });

    if (!transactionRes.ok) {
        const errBody = await transactionRes.text();
        throw new Error(`Shippo label purchase failed: ${errBody}`);
    }

    const transaction = await transactionRes.json();

    if (transaction.status !== "SUCCESS") {
        throw new Error(
            `Label generation failed: ${transaction.messages?.map((m: { text: string }) => m.text).join(", ") ?? "Unknown error"}`
        );
    }

    const labelUrl: string = transaction.label_url;
    const trackingNumber: string = transaction.tracking_number;

    // 5. Store label URL and tracking number on order
    const { error: updateError } = await supabase
        .from("orders")
        .update({
            shipping_label_url: labelUrl,
            tracking_number: trackingNumber,
            fulfillment_status: "fulfilled",
        })
        .eq("id", orderId);

    if (updateError) throw updateError;
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { labelUrl, trackingNumber };
}
