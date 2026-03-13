import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db/orders';
import { shippo } from '@/lib/shippo';

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        const addressTo = {
            name: order.customer_name || 'Customer',
            street1: order.shipping_address.line1,
            city: order.shipping_address.city,
            state: order.shipping_address.state,
            zip: order.shipping_address.postal_code,
            country: order.shipping_address.country,
            email: order.customer_email,
        };

        const addressFrom = {
            name: process.env.WAREHOUSE_NAME || 'Warehouse',
            street1: process.env.WAREHOUSE_ADDRESS_LINE1 || '123 Main St',
            city: process.env.WAREHOUSE_CITY || 'San Francisco',
            state: process.env.WAREHOUSE_STATE || 'CA',
            zip: process.env.WAREHOUSE_ZIP || '94105',
            country: process.env.WAREHOUSE_COUNTRY || 'US',
            phone: process.env.WAREHOUSE_PHONE || '+1 555 341 9393',
        };

        const parcelData = {
            length: '10', width: '8', height: '4', distanceUnit: 'in',
            weight: '2', massUnit: 'lb',
        };

        const shipmentDto: any = {
            addressFrom,
            addressTo,
            parcels: [parcelData],
            async: false,
        };

        const shippoShipment = await shippo.shipments.create(shipmentDto);

        return NextResponse.json({ success: true, rates: shippoShipment.rates });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
