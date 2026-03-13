import { supabaseAdmin } from '../supabase';

export async function createOrder(data: {
    customer_email: string;
    customer_name: string | null;
    customer_phone: string | null;
    shipping_address: any;
    amount_total: number;
    currency: string;
    payment_status: string;
    fulfillment_status: string;
}) {
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert(data)
        .select()
        .single();

    if (error) throw new Error(`createOrder error: ${error.message}`);
    return order;
}

export async function getOrderById(id: string) {
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(`getOrderById error: ${error.message}`);
    return order;
}

export async function updateOrderStatus(
    id: string,
    updates: { payment_status?: string; fulfillment_status?: string }
) {
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(`updateOrderStatus error: ${error.message}`);
    return order;
}

export async function listOrders(limit = 50, offset = 0) {
    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw new Error(`listOrders error: ${error.message}`);
    return orders;
}
