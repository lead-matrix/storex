import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { verifyShippoSignature } from '@/lib/utils/shippo';
import { 
    sendShippingNotificationEmail, 
    sendOutForDeliveryNotificationEmail, 
    sendDeliveryNotificationEmail 
} from '@/lib/utils/email';

export async function POST(req: NextRequest) {
    const bodyText = await req.text();
    const signature = req.headers.get('x-shippo-signature') || '';

    const searchParams = req.nextUrl.searchParams;
    const urlToken = searchParams.get('token');
    const secret = process.env.SHIPPO_WEBHOOK_SECRET;

    // 1. Verify via URL Token (Method B) OR HMAC Signature (Method A)
    const isValid = (urlToken && urlToken === secret) || (await verifyShippoSignature(bodyText, signature));
    
    if (!isValid) {
        console.error('[Shippo Webhook] Unauthorized access attempt');
        return NextResponse.json({ error: 'Invalid security token' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (event !== 'track_updated') {
        return NextResponse.json({ message: 'Event ignored' });
    }

    const trackingNumber = data.tracking_number;
    const carrier = data.carrier;
    const trackingStatus = data.tracking_status; // Latest status object

    if (!trackingNumber || !trackingStatus) {
        return NextResponse.json({ error: 'Missing tracking data' }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. Find Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

    if (orderError || !order) {
        console.warn(`[Shippo Webhook] Order not found for tracking: ${trackingNumber}`);
        return NextResponse.json({ message: 'Order not found' });
    }

    // 3. Update Order Status
    let nextStatus: string = order.status;
    let fulfillmentStatus: string = order.fulfillment_status;

    // Map Shippo statuses to our Order statuses
    // SHippo statuses: UNKNOWN, PRE_TRANSIT, TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RETURNED, FAILURE
    const shippoStatus = trackingStatus.status;

    if (shippoStatus === 'DELIVERED') {
        nextStatus = 'delivered';
        fulfillmentStatus = 'delivered';
    } else if (shippoStatus === 'OUT_FOR_DELIVERY') {
        nextStatus = 'out_for_delivery';
        fulfillmentStatus = 'out_for_delivery';
    } else if (shippoStatus === 'TRANSIT') {
        // Only update to 'shipped' if it wasn't already 'out_for_delivery' or 'delivered'
        if (order.status !== 'delivered' && order.status !== 'out_for_delivery') {
            nextStatus = 'shipped';
            fulfillmentStatus = 'shipped';
        }
    }

    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: nextStatus as any,
            fulfillment_status: fulfillmentStatus as any,
            shippo_tracking_status: shippoStatus,
            carrier: carrier,
            updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

    if (updateError) {
        console.error('[Shippo Webhook] Update Order Error:', updateError);
    }

    // 4. Record Tracking History
    // Shippo tracking status objects have an 'object_id' which is unique for that specific update
    const eventId = trackingStatus.object_id;
    
    if (eventId) {
        await supabase
            .from('order_tracking_history')
            .upsert({
                order_id: order.id,
                status: shippoStatus,
                details: trackingStatus.status_details,
                location: trackingStatus.location 
                    ? `${trackingStatus.location.city || ''}, ${trackingStatus.location.state || ''} ${trackingStatus.location.country || ''}`.trim().replace(/^,/, '').trim()
                    : null,
                shippo_event_id: eventId,
                object_created: trackingStatus.object_created,
            }, { onConflict: 'shippo_event_id' });
    }

    // 5. Trigger Emails on State Changes
    if (nextStatus !== order.status) {
        const customerName = order.shipping_address?.name || 'Valued Customer';
        const customerEmail = order.customer_email || order.shipping_address?.email;

        if (customerEmail) {
            if (nextStatus === 'shipped' && order.status === 'paid') {
                await sendShippingNotificationEmail({
                    customerEmail,
                    customerName,
                    trackingNumber,
                    orderId: order.id,
                    totalAmount: order.amount_total
                });
            } else if (nextStatus === 'out_for_delivery') {
                await sendOutForDeliveryNotificationEmail({
                    customerEmail,
                    customerName,
                    trackingNumber,
                    orderId: order.id,
                    totalAmount: order.amount_total
                });
            } else if (nextStatus === 'delivered') {
                await sendDeliveryNotificationEmail({
                    customerEmail,
                    customerName,
                    orderId: order.id,
                    totalAmount: order.amount_total
                });
            }
        }
    }

    return NextResponse.json({ success: true });
}