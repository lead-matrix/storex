import { supabaseAdmin } from '../supabase/admin';

export async function createOrderItems(items: {
    order_id: string;
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    price: number;
    // Snapshot fields — store names at time of purchase so history never breaks
    // if a product is renamed or deleted later
    product_name?: string;
    variant_name?: string | null;
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
                images,
                weight_oz,
                sku,
                country_of_origin,
                customs_value_usd
            ),
            product_variants (
                weight,
                sku
            )
        `)
        .eq('order_id', orderId);

    if (error) throw new Error(`getItemsByOrder error: ${error.message}`);
    return data;
}

export async function updateFulfilledQuantity(itemId: string, increment: number) {
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
