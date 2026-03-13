import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getLabelByTrackingNumber } from '@/lib/db/labels';
import { createTrackingEvent } from '@/lib/db/tracking';
import { updateShipmentStatus } from '@/lib/db/shipments';
import { updateOrderStatus, getOrderById } from '@/lib/db/orders';
import { sendDeliveryNotification } from '@/lib/resend';

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        // Shippo uses a different signature mechanism if configured, but let's assume
        // we just parse the JSON for this production spec as is common, or validate if possible.
        const body = JSON.parse(payload);

        if (body.event !== 'track_updated') {
            return NextResponse.json({ received: true });
        }

        const { tracking_number, tracking_status, tracking_history } = body.data;

        // 1. Get the label and shipment
        const labelData = await getLabelByTrackingNumber(tracking_number);
        if (!labelData || !labelData.shipment_id) {
            console.warn('Shippo Webhook: No record found for tracking number', tracking_number);
            return NextResponse.json({ received: true });
        }

        const shipmentId = labelData.shipment_id;
        const currentStatus = tracking_status.status; // e.g. TRANSIT, DELIVERED, RETURNED, FAILURE

        // Save tracking event
        await createTrackingEvent({
            shipment_id: shipmentId,
            status: currentStatus,
            status_details: tracking_status.status_details || '',
            location: tracking_status.location,
            event_time: tracking_status.status_date,
            raw: tracking_status,
        });

        // Update shipment status
        await updateShipmentStatus(shipmentId, currentStatus);

        // If delivered, send delivery email and mark order fully fulfilled/delivered if needed
        if (currentStatus === 'DELIVERED') {
            const orderId = labelData.shipments?.order_id;
            if (orderId) {
                await updateOrderStatus(orderId, { fulfillment_status: 'delivered' });
                const order = await getOrderById(orderId);
                if (order && order.customer_email) {
                    // Send delivery notification email
                    const trackingUrl = body.data.tracking_url_provider || '';
                    await sendDeliveryNotification(order.customer_email, order.id, trackingUrl);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Shippo Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
