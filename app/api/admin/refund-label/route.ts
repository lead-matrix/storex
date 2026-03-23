import { NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';
import { getLabelByShipment } from '@/lib/db/labels';
import { getShipmentByOrder, updateShipmentStatus } from '@/lib/db/shipments';
import { updateOrderStatus } from '@/lib/db/orders';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    // ── Auth Guard ─────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // ───────────────────────────────────────────────────────

    try {
        const { orderId } = await req.json();

        const shipment = await getShipmentByOrder(orderId);
        if (!shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }

        const label = await getLabelByShipment(shipment.id);
        if (!label) {
            return NextResponse.json({ error: 'Label not found' }, { status: 404 });
        }

        const refund = await shippo.refunds.create({
            transaction: label.shippo_transaction_id
        });

        if (refund.status === 'QUEUED' || refund.status === 'SUCCESS') {
            await updateShipmentStatus(shipment.id, 'refund_requested');
            await updateOrderStatus(orderId, { fulfillment_status: 'unfulfilled' });
            return NextResponse.json({ success: true, refund });
        } else {
            throw new Error('Refund failed');
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
