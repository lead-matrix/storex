import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin"; // Bypass RLS for webhook

// We need an admin client to override RLS and update the order
// We only accept valid requests from Shippo

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic verification (in production, verify Shippo webhook signature)
        // Shippo sends Webhooks with {"event": "track_updated", "data": { tracking_status: { status: "DELIVERED", ... }, tracking_number: "..." }}

        if (body.event !== "track_updated") {
            return NextResponse.json({ message: "Ignored, not a track_updated event" }, { status: 200 });
        }

        const data = body.data;
        if (!data || !data.tracking_number || !data.tracking_status) {
            return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
        }

        const trackingNumber = data.tracking_number;
        const shippoStatus = data.tracking_status.status; // e.g., "TRANSIT", "DELIVERED", "RETURNED", "FAILURE"

        // Map Shippo tracking status to our database fulfillment_status
        // Our DB fulfillment_status values typically: unfulfilled, fulfilled, shipped, delivered
        let newFulfillmentStatus = "shipped";

        if (shippoStatus === "DELIVERED") {
            newFulfillmentStatus = "delivered";
        } else if (shippoStatus === "RETURNED") {
            newFulfillmentStatus = "returned";
        }

        const supabase = await createClient(); // Admin client

        // Find the order by tracking number
        const { data: order, error: findError } = await supabase
            .from("orders")
            .select("id")
            .eq("tracking_number", trackingNumber)
            .single();

        if (findError || !order) {
            console.error(`Webhook error: Order with tracking ${trackingNumber} not found.`);
            // Still return 200 so Shippo doesn't retry infinitely
            return NextResponse.json({ message: "Order not found" }, { status: 200 });
        }

        // Update the fulfillment status
        const { error: updateError } = await supabase
            .from("orders")
            .update({ fulfillment_status: newFulfillmentStatus })
            .eq("id", order.id);

        if (updateError) {
            console.error(`Webhook error: Failed to update order ${order.id}.`, updateError);
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
        }

        console.log(`Successfully updated order ${order.id} to ${newFulfillmentStatus} via Shippo webhook.`);
        return NextResponse.json({ success: true, orderId: order.id, status: newFulfillmentStatus });

    } catch (error: any) {
        console.error("Shippo Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
