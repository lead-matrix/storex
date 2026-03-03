"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

    if (error) throw error;
    revalidatePath("/admin/orders");
}

export async function generateShippingLabel(orderId: string) {
    const supabase = await createClient();
    const shippoKey = process.env.SHIPPO_API_KEY;

    if (!shippoKey) throw new Error("Shippo API key missing");

    // Fetch the order with shipping address
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");

    const res = await fetch("https://api.goshippo.com/shipments/", {
        method: "POST",
        headers: {
            Authorization: `ShippoToken ${shippoKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            address_from: {
                name: "Dina Cosmetic",
                street1: "Texas",
                city: "Houston",
                state: "TX",
                zip: "77001",
                country: "US",
                email: "support@dinacosmetic.store",
                phone: "+12816877609",
            },
            address_to: order.shipping_address || {
                name: "Customer",
                street1: "123 Customer St",
                city: "NY",
                state: "NY",
                zip: "10001",
                country: "US",
            },
            parcels: [
                { length: "8", width: "6", height: "4", distance_unit: "in", weight: "0.5", mass_unit: "lb" },
            ],
            async: false,
        }),
    });

    const labelData = await res.json();

    if (!labelData.rates || labelData.rates.length === 0) {
        throw new Error("No shipping rates found.");
    }

    const labelUrl = labelData.rates[0].label_url;
    const trackingNumber = labelData.rates[0].tracking_number;

    const { error: updateError } = await supabase
        .from("orders")
        .update({
            shipping_label_url: labelUrl,
            tracking_number: trackingNumber,
            fulfillment_status: 'fulfilled'
        })
        .eq("id", orderId);

    if (updateError) throw updateError;
    revalidatePath("/admin/orders");

    return labelUrl;
}
