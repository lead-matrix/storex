'use server'

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createShippingLabel } from "@/lib/utils/shippo";
import { sendShippingNotificationEmail } from "@/lib/utils/email";

// Helper to ensure the user is an admin
async function ensureAdmin() {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error("Unauthorized: Obsidian Palace access restricted to administrators");
    }

    return supabase;
}

export async function createProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    // Support both 'price' and 'base_price' field names from the form
    const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
    const price = parseFloat(priceRaw);
    // DB uses 'inventory' column (our SQL migration also adds 'stock' alias)
    // Write to both so it works before and after migration
    const inventoryQty = parseInt((formData.get('stock') as string) || '0');
    const category_id = (formData.get('category_id') as string) || null;
    const is_featured = formData.get('is_featured') === 'on';
    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? imagesRaw.split(',').map(img => img.trim()).filter(img => img !== '')
        : [];

    if (!name || isNaN(price)) {
        throw new Error("Product name and price are required.");
    }

    const { data: product, error } = await supabase
        .from('products')
        .insert([{
            name,
            description,
            price,
            inventory: inventoryQty,  // real DB column name
            images,
            is_featured,
            is_active: true,
            ...(category_id ? { category_id } : {}),
        }])
        .select()
        .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/collections');
    revalidatePath('/');
    return product;
}

export async function updateProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    // Support both 'price' and 'base_price' field names from the form
    const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
    const price = parseFloat(priceRaw);
    const inventoryQty = parseInt((formData.get('stock') as string) || '0');
    const category_id = (formData.get('category_id') as string) || null;
    const is_featured = formData.get('is_featured') === 'on';
    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? imagesRaw.split(',').map(img => img.trim()).filter(img => img !== '')
        : [];

    if (!id) throw new Error("Product ID is required for update.");

    const { error } = await supabase
        .from('products')
        .update({
            name,
            description,
            price,
            inventory: inventoryQty,  // real DB column
            images,
            is_featured,
            ...(category_id ? { category_id } : { category_id: null }),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(`Failed to update product: ${error.message}`);

    revalidatePath('/admin/products');
    revalidatePath(`/shop/${id}`);
    revalidatePath('/shop');
    revalidatePath('/collections');
    revalidatePath('/');
}

export async function deleteProduct(id: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete product: ${error.message}`);

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/collections');
    revalidatePath('/');
}

export async function fulfillOrder(orderId: string) {
    const supabase = await ensureAdmin();

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, profiles(email)')
        .eq('id', orderId)
        .single();

    if (orderError || !order) throw new Error("Order not found");

    const shipping = await createShippingLabel(order);

    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: 'shipped',
            tracking_number: shipping.tracking_number,
        })
        .eq('id', orderId);

    if (updateError) throw new Error(updateError.message);

    const customerEmail = (order.profiles as { email?: string })?.email;
    if (customerEmail) {
        await sendShippingNotificationEmail({
            orderId,
            customerEmail,
            customerName: (order.shipping_address as { name?: string })?.name || 'Valued Client',
            totalAmount: order.amount_total,
            trackingNumber: shipping.tracking_number,
            labelUrl: shipping.label_url
        });
    }

    revalidatePath('/admin/orders');
}

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/orders');
}
