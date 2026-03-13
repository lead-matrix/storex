import { NextResponse } from 'next/server';
import { getLabelByShipment } from '@/lib/db/labels';
import { getShipmentByOrder } from '@/lib/db/shipments';

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

        return NextResponse.json({ labelUrl: label.label_url });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
