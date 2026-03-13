import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import { sendShippingNotificationEmail, sendDeliveryNotificationEmail } from "@/lib/utils/email";

interface ShippoTrackingStatus {
    status: string;
    status_details: string;
    status_date: string;
}

interface ShippoWebhookBody {
    event: string;
    data: {
        tracking_number: string;
        tracking_status: ShippoTrackingStatus;
        carrier: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as ShippoWebhookBody;

        if (body.event !== "track_updated") {
            return NextResponse.json({ message: "Ignored, not a track_updated event" }, { status: 200 });
        }

        const data = body.data;
        if (!data || !data.tracking_number || !data.tracking_status) {
            return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
        }

        const trackingNumber = data.tracking_number;
        const shippoStatus = data.tracking_status.status;

        let newFulfillmentStatus = "shipped";
        if (shippoStatus === "DELIVERED") {
            newFulfillmentStatus = "delivered";
        } else if (shippoStatus === "RETURNED") {
            newFulfillmentStatus = "returned";
        }

        const supabase = await createClient();

        const { data: order, error: findError } = await supabase
            .from("orders")
            .select("id, customer_email, billing_address")
            .eq("tracking_number", trackingNumber)
            .single();

        if (findError || !order) {
            console.error(`Webhook error: Order with tracking ${trackingNumber} not found.`);
            return NextResponse.json({ message: "Order not found" }, { status: 200 });
        }

        const { error: updateError } = await supabase
            .from("orders")
            .update({ fulfillment_status: newFulfillmentStatus })
            .eq("id", order.id);

        if (updateError) {
            console.error(`Webhook error: Failed to update order ${order.id}.`, updateError);
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
        }

        // Send Email Notifications
        const customerName = (order.billing_address as any)?.name || "Valued Client";

        if (shippoStatus === "DELIVERED") {
            await sendDeliveryNotificationEmail({
                customerEmail: order.customer_email,
                customerName,
                orderId: order.id,
                totalAmount: 0 // Not needed for delivery email
            });
        } else if (shippoStatus === "TRANSIT" || shippoStatus === "PRE_TRANSIT") {
            // Avoid spamming transit emails, but ensure at least one "shipped" notification
            // Logic could be more complex here to prevent duplicates
        }

        console.log(`Successfully updated order ${order.id} to ${newFulfillmentStatus} via Shippo webhook.`);
        return NextResponse.json({ success: true, orderId: order.id, status: newFulfillmentStatus });

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Shippo Webhook Error:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
