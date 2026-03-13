import { supabaseAdmin } from '../supabase';

export async function createOrderItems(items: {
    order_id: string;
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    price: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
}[]) {
    const { data, error } = await supabaseAdmin
        .from('order_items')
        .insert(items)
        .select();

    if (error) throw new Error(`createOrderItems error: ${error.message}`);
    return data;
}

export async function getItemsByOrder(orderId: string) {
    const { data, error } = await supabaseAdmin
        .from('order_items')
        .select(`
      *,
      products (
        title,
        images
      )
    `)
        .eq('order_id', orderId);

    if (error) throw new Error(`getItemsByOrder error: ${error.message}`);
    return data;
}
export async function updateFulfilledQuantity(itemId: string, increment: number) {
    // Current quantity fetch + update to ensure we don't exceed total
    const { data: item, error: fetchError } = await supabaseAdmin
        .from('order_items')
        .select('fulfilled_quantity, quantity')
        .eq('id', itemId)
        .single();

    if (fetchError) throw fetchError;

    const newFulfilled = (item.fulfilled_quantity || 0) + increment;
    if (newFulfilled > item.quantity) {
        throw new Error(`Cannot fulfill more than ordered. Ordered: ${item.quantity}, Fulfilled: ${newFulfilled}`);
    }

    const { data, error } = await supabaseAdmin
        .from('order_items')
        .update({ fulfilled_quantity: newFulfilled })
        .eq('id', itemId)
        .select()
        .single();

    if (error) throw new Error(`updateFulfilledQuantity error: ${error.message}`);
    return data;
}
