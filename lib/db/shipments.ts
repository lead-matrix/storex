import { supabaseAdmin } from '../supabase';

export async function createShipment(data: {
    order_id: string;
    shippo_shipment_id?: string;
    carrier?: string;
    service?: string;
    status?: string;
}) {
    const { data: shipment, error } = await supabaseAdmin
        .from('shipments')
        .insert(data)
        .select()
        .single();

    if (error) throw new Error(`createShipment error: ${error.message}`);
    return shipment;
}

export async function updateShipmentStatus(
    id: string,
    status: string,
    details?: any
) {
    const { data: shipment, error } = await supabaseAdmin
        .from('shipments')
        .update({ status, ...details })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`updateShipmentStatus error: ${error.message}`);
    return shipment;
}

export async function getShipmentByOrder(orderId: string) {
    const { data, error } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`getShipmentByOrder error: ${error.message}`);
    }
    return data;
}

export async function getShipmentById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(`getShipmentById error: ${error.message}`);
    return data;
}
