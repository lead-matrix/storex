import { NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';
import { getLabelByShipment } from '@/lib/db/labels';
import { getShipmentByOrder, updateShipmentStatus } from '@/lib/db/shipments';
import { updateOrderStatus } from '@/lib/db/orders';

export async function POST(req: Request) {
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

        // Refund label in shippo
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
