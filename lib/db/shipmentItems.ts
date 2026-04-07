import { createClient as createAdminClient } from '../supabase/admin';
const supabaseAdmin = await createAdminClient();

export async function createShipmentItems(items: {
    shipment_id: string;
    order_item_id: string;
    quantity: number;
}[]) {
    const { data, error } = await supabaseAdmin
        .from('shipment_items')
        .insert(items)
        .select();

    if (error) throw new Error(`createShipmentItems error: ${error.message}`);
    return data;
}

export async function getItemsByShipment(shipmentId: string) {
    const { data, error } = await supabaseAdmin
        .from('shipment_items')
        .select(`
            *,
            order_items (
                *
            )
        `)
        .eq('shipment_id', shipmentId);

    if (error) throw new Error(`getItemsByShipment error: ${error.message}`);
    return data;
}
