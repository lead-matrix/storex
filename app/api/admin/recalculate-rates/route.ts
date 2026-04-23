import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db/orders';
import { getItemsByOrder } from '@/lib/db/orderItems';
import { shippo } from '@/lib/shippo';
import { calculateTotalWeightLb, getParcelForWeight } from '@/lib/utils/shippo';
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

        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        const allItems = await getItemsByOrder(orderId);
        const weightItems = (allItems as any[]).map((item) => ({
            quantity: item.quantity,
            variant_weight_oz: item.product_variants?.weight ? Number(item.product_variants.weight) : null,
            // FIX: column is weight_oz, not weight_grams
            product_weight_oz: item.products?.weight_oz ? Number(item.products.weight_oz) : null,
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

        // Fetch warehouse address from site_settings first, then env fallback
        const { data: settings } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'warehouse_info')
            .maybeSingle();

        const warehouseInfo = settings?.setting_value as any;
        const addressFrom = {
            name: warehouseInfo?.name || process.env.WAREHOUSE_NAME || 'Warehouse',
            street1: warehouseInfo?.street1 || process.env.WAREHOUSE_ADDRESS_LINE1 || '',
            city: warehouseInfo?.city || process.env.WAREHOUSE_CITY || '',
            state: warehouseInfo?.state || process.env.WAREHOUSE_STATE || '',
            zip: warehouseInfo?.zip || process.env.WAREHOUSE_ZIP || '',
            country: warehouseInfo?.country || process.env.WAREHOUSE_COUNTRY || 'US',
            phone: warehouseInfo?.phone || process.env.WAREHOUSE_PHONE || '',
        };

        const shipmentDto: any = {
            addressFrom,
            addressTo,
            parcels: [parcelData],
            async: false,
        };

        const shippoShipment = await shippo.shipments.create(shipmentDto);

        return NextResponse.json({ success: true, rates: shippoShipment.rates });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
