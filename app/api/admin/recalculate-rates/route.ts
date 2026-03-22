import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db/orders';
import { getItemsByOrder } from '@/lib/db/orderItems';
import { shippo } from '@/lib/shippo';
import { calculateTotalWeightLb, getParcelForWeight } from '@/lib/utils/shippo';

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        // Use the shared weight calculator so re-quoted rates match the real label cost
        const allItems = await getItemsByOrder(orderId);
        const weightItems = (allItems as any[]).map((item) => ({
            quantity: item.quantity,
            variant_weight_oz: item.product_variants?.weight ? Number(item.product_variants.weight) : null,
            product_weight_oz: item.products?.weight_grams ? Number(item.products.weight_grams) : null,
        }));
        const totalWeightLb = calculateTotalWeightLb(weightItems);
        const parcelData = getParcelForWeight(totalWeightLb);

        const address = order.shipping_address as any;
        const addressTo = {
            name: order.customer_name || 'Customer',
            street1: address?.address?.line1 || address?.line1 || address?.street1 || '',
            city: address?.address?.city || address?.city || '',
            state: address?.address?.state || address?.state || '',
            zip: address?.address?.postal_code || address?.postal_code || address?.zip || '',
            country: address?.address?.country || address?.country || 'US',
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
