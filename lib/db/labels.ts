import { createClient as createAdminClient } from '../supabase/admin';
const supabaseAdmin = await createAdminClient();

export async function createShippingLabel(data: {
    shipment_id: string;
    shippo_transaction_id: string;
    tracking_number: string;
    label_url: string;
    carrier: string;
    service: string;
}) {
    const { data: label, error } = await supabaseAdmin
        .from('shipping_labels')
        .insert(data)
        .select()
        .single();

    if (error) throw new Error(`createShippingLabel error: ${error.message}`);
    return label;
}

export async function getLabelByShipment(shipmentId: string) {
    const { data, error } = await supabaseAdmin
        .from('shipping_labels')
        .select('*')
        .eq('shipment_id', shipmentId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`getLabelByShipment error: ${error.message}`);
    }
    return data;
}

export async function getLabelByTrackingNumber(trackingNumber: string) {
    const { data, error } = await supabaseAdmin
        .from('shipping_labels')
        .select('*, shipments(order_id)')
        .eq('tracking_number', trackingNumber)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`getLabelByTrackingNumber error: ${error.message}`);
    }
    return data;
}
