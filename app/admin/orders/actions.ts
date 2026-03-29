"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendShippingNotificationEmail } from "@/lib/utils/email";
import { getShippingRates, purchaseLabelForRate, createShipmentAndLabel } from "@/services/shippingService";

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

export async function fetchShippingRatesAction(orderId: string, itemsToFulfill?: { id: string, quantity: number }[]) {
    await ensureAdmin();
    const result = await getShippingRates(orderId, itemsToFulfill);
    return {
        shipmentId: result.shipmentId,
        parcelName: (result as any).parcelName,
        rates: result.rates.map((r: any) => ({
            id: r.objectId,
            provider: r.provider,
            service: r.servicelevel?.name || 'Standard Shipping',
            amount: r.amount,
            estimatedDays: r.estimated_days,
            provider_image: r.provider_image_75
        }))
    };
}

export async function completeFulfillmentAction(orderId: string, rateId: string, carrier: string, service: string, itemsToFulfill?: { id: string, quantity: number }[]) {
    await ensureAdmin();
    const result = await purchaseLabelForRate(orderId, rateId, carrier, service, itemsToFulfill);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return result;
}

export async function generateShippingLabel(orderId: string) {
    await ensureAdmin();
    const result = await createShipmentAndLabel(orderId);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return result;
}

