import { supabaseAdmin } from '../supabase';

export async function createTrackingEvent(data: {
    shipment_id: string;
    status: string;
    status_details?: string;
    location?: any;
    event_time?: string;
    raw?: any;
}) {
    const { data: event, error } = await supabaseAdmin
        .from('shipment_tracking')
        .insert(data)
        .select()
        .single();

    if (error) throw new Error(`createTrackingEvent error: ${error.message}`);
    return event;
}

export async function getTrackingHistory(shipmentId: string) {
    const { data, error } = await supabaseAdmin
        .from('shipment_tracking')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_time', { ascending: false });

    if (error) throw new Error(`getTrackingHistory error: ${error.message}`);
    return data;
}
