import { createClient as createAdminClient } from '../supabase/admin';
const supabaseAdmin = await createAdminClient();

export async function createOrderItems(items: {
    order_id: string;
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    price: number;
    // Snapshot fields — store names at time of purchase so history never breaks
    // if a product is renamed or deleted later (Bug #5)
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
        // BUG #2 FIX: The column was renamed weight_grams → weight_oz by the
        // migration in MASTER.sql. Selecting weight_grams returns null for every
        // product, causing all weights to fall back to 2oz and all shipping rates
        // to be wrong. Changed to weight_oz throughout.
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
