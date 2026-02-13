'use server'

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { createShippingLabel } from "@/lib/utils/shippo";
import { sendShippingNotificationEmail } from "@/lib/utils/email";
import { redirect } from "next/navigation";

// Helper to ensure the user is an admin
async function ensureAdmin() {
    const supabase = await createServerClient();
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

export async function updateProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const base_price = parseFloat(formData.get('base_price') as string);
    const is_featured = formData.get('is_featured') === 'on';
    const images = (formData.get('images') as string)?.split(',').map(img => img.trim()).filter(img => img !== '');

    const { error } = await supabase
        .from('products')
        .update({ name, description, base_price, is_featured, images, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);

    // Handle Variants
    const variantCount = parseInt(formData.get('variant_count') as string || '0');
    const variantData = [];

    for (let i = 0; i < variantCount; i++) {
        const vName = formData.get(`variant_name_${i}`) as string;
        const vPrice = formData.get(`variant_price_${i}`) ? parseFloat(formData.get(`variant_price_${i}`) as string) : null;
        const vStock = parseInt(formData.get(`variant_stock_${i}`) as string || '0');
        const vSku = formData.get(`variant_sku_${i}`) as string;

        if (vName) {
            variantData.push({
                product_id: id,
                name: vName,
                price_override: vPrice,
                stock_quantity: vStock,
                sku: vSku
            });
        }
    }

    // Simple strategy: delete existing and re-insert
    await supabase.from('variants').delete().eq('product_id', id);
    if (variantData.length > 0) {
        await supabase.from('variants').insert(variantData);
    }

    revalidatePath('/admin/products');
    revalidatePath(`/shop/${id}`);
}

export async function createProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const base_price = parseFloat(formData.get('base_price') as string);
    const images = (formData.get('images') as string)?.split(',').map(img => img.trim()).filter(img => img !== '');

    const { data: product, error } = await supabase
        .from('products')
        .insert([{ name, description, base_price, images }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Handle Variants
    const variantCount = parseInt(formData.get('variant_count') as string || '0');
    const variantData = [];

    for (let i = 0; i < variantCount; i++) {
        const vName = formData.get(`variant_name_${i}`) as string;
        const vPrice = formData.get(`variant_price_${i}`) ? parseFloat(formData.get(`variant_price_${i}`) as string) : null;
        const vStock = parseInt(formData.get(`variant_stock_${i}`) as string || '0');
        const vSku = formData.get(`variant_sku_${i}`) as string;

        if (vName) {
            variantData.push({
                product_id: product.id,
                name: vName,
                price_override: vPrice,
                stock_quantity: vStock,
                sku: vSku
            });
        }
    }

    if (variantData.length > 0) {
        await supabase.from('variants').insert(variantData);
    }

    revalidatePath('/admin/products');
    return product;
}

export async function deleteProduct(id: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/products');
}

export async function fulfillOrder(orderId: string) {
    const supabase = await ensureAdmin();

    // 1. Get order details with customer email
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, profiles(email)')
        .eq('id', orderId)
        .single();

    if (orderError || !order) throw new Error("Order not found");

    // 2. Generate Shippo Label
    const shipping = await createShippingLabel(order);

    // 3. Update Order in DB
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: 'shipped',
            tracking_number: shipping.tracking_number,
            metadata: {
                ...order.metadata,
                shipping_label_url: shipping.label_url
            }
        })
        .eq('id', orderId);

    if (updateError) throw new Error(updateError.message);

    // 4. Send Shipping Notification Email
    const customerEmail = (order.profiles as any)?.email;
    if (customerEmail) {
        await sendShippingNotificationEmail({
            orderId,
            customerEmail,
            customerName: (order.shipping_address as any)?.name || 'Valued Client',
            totalAmount: order.total_amount,
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

