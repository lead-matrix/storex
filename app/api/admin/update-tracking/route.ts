import { NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';
import { getLabelByShipment } from '@/lib/db/labels';
import { getShipmentByOrder, updateShipmentStatus } from '@/lib/db/shipments';
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
        if (!shipment) throw new Error('Shipment not found');

        const label = await getLabelByShipment(shipment.id);
        if (!label || !label.carrier || !label.tracking_number) {
            throw new Error('Label not found or missing tracking details');
        }

        const tracking = await shippo.trackingStatus.get(label.tracking_number, label.carrier);

        if (tracking && tracking.trackingStatus) {
            await updateShipmentStatus(shipment.id, tracking.trackingStatus.status);
        }

        return NextResponse.json({ success: true, tracking: tracking?.trackingStatus });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
