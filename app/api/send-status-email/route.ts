import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { orderId, status, trackingNumber, carrier } = await req.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Fetch order details
        // FIX: removed non-existent 'order_id' column — orders PK is 'id'
        const { data: order, error } = await supabase
            .from('orders')
            .select('id, customer_email, customer_name, amount_total, shipping_address, tracking_number')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const customerEmail = order.customer_email;
        if (!customerEmail || customerEmail === 'pending@stripe') {
            return NextResponse.json({ error: 'No customer email on order' }, { status: 400 });
        }

        const customerName =
            order.customer_name ||
            (order.shipping_address as any)?.name ||
            'Valued Client';

        const resolvedTracking = trackingNumber || order.tracking_number || null;

        const {
            sendShippingNotificationEmail,
            sendDeliveryNotificationEmail,
        } = await import('@/lib/utils/email');

        if (status === 'shipped') {
            await sendShippingNotificationEmail({
                orderId,
                customerEmail,
                customerName,
                totalAmount: Number(order.amount_total),
                trackingNumber: resolvedTracking,
            });
        } else if (status === 'delivered') {
            await sendDeliveryNotificationEmail({
                orderId,
                customerEmail,
                customerName,
                totalAmount: Number(order.amount_total),
            });
        } else {
            return NextResponse.json({ error: `No email template for status: ${status}` }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[send-status-email] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
