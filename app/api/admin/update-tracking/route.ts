import { NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';
import { getLabelByShipment } from '@/lib/db/labels';
import { getShipmentByOrder, updateShipmentStatus } from '@/lib/db/shipments';

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        const shipment = await getShipmentByOrder(orderId);
        if (!shipment) throw new Error('Shipment not found');

        const label = await getLabelByShipment(shipment.id);
        if (!label || !label.carrier || !label.tracking_number) {
            throw new Error('Label not found or missing tracking details');
        }

        // Force register tracking webhook / get status
        const tracking = await shippo.trackingStatus.get(label.tracking_number, label.carrier);

        // Update status based on current tracked state
        if (tracking && tracking.trackingStatus) {
            await updateShipmentStatus(shipment.id, tracking.trackingStatus.status);
        }

        return NextResponse.json({ success: true, tracking: tracking?.trackingStatus });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
