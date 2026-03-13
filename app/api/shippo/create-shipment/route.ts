import { NextResponse } from 'next/server';
import { createShipmentAndLabel } from '@/services/shippingService';

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
        }

        const transaction = await createShipmentAndLabel(orderId);

        return NextResponse.json({ success: true, transaction });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
