import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import {
  sendShippingNotificationEmail,
  sendDeliveryNotificationEmail,
} from "@/lib/utils/email";

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
    const body = (await req.json()) as ShippoWebhookBody;

    if (body.event !== "track_updated") {
      return NextResponse.json({ ignored: true });
    }

    const { tracking_number, tracking_status } = body.data || {};

    if (!tracking_number || !tracking_status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();

    // ✅ Idempotency (prevent duplicate processing)
    const eventId = `${tracking_number}_${tracking_status.status}_${tracking_status.status_date}`;

    const { data: existing } = await supabase
      .from("shippo_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ duplicate: true });
    }

    // ✅ Map Shippo status → internal status
    let newStatus = "shipped";

    switch (tracking_status.status) {
      case "DELIVERED":
        newStatus = "delivered";
        break;
      case "RETURNED":
        newStatus = "returned";
        break;
      case "FAILURE":
        newStatus = "failed";
        break;
      case "OUT_FOR_DELIVERY":
        newStatus = "out_for_delivery";
        break;
      case "TRANSIT":
      case "PRE_TRANSIT":
        newStatus = "shipped";
        break;
    }

    // ✅ Fetch order
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, customer_email, billing_address, fulfillment_status")
      .eq("tracking_number", tracking_number)
      .maybeSingle();

    if (findError || !order) {
      console.error("Order not found:", tracking_number);
      return NextResponse.json({ notFound: true });
    }

    // ✅ Prevent unnecessary updates
    if (order.fulfillment_status === newStatus) {
      await supabase.from("shippo_events").insert({
        id: eventId,
        status: "skipped_duplicate_status",
      });

      return NextResponse.json({ skipped: true });
    }

    // ✅ Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        fulfillment_status: newStatus,
        last_tracking_update: tracking_status.status_date,
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    const customerName =
      (order.billing_address as any)?.name || "Customer";

    // ✅ Controlled email triggers (NO spam)
    if (newStatus === "shipped") {
      await sendShippingNotificationEmail({
        customerEmail: order.customer_email,
        customerName,
        orderId: order.id,
      });
    }

    if (newStatus === "out_for_delivery") {
      // Optional future email
    }

    if (newStatus === "delivered") {
      await sendDeliveryNotificationEmail({
        customerEmail: order.customer_email,
        customerName,
        orderId: order.id,
        totalAmount: 0,
      });
    }

    // ✅ Log event AFTER success
    await supabase.from("shippo_events").insert({
      id: eventId,
      order_id: order.id,
      status: newStatus,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("Shippo webhook failed:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}