'use server'

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createShippingLabel } from "@/lib/utils/shippo";
import { sendShippingNotificationEmail } from "@/lib/utils/email";

// Helper to ensure the user is an admin
async function ensureAdmin() {
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Authentication required");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
    }

    return supabase;
}

// ─────────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
    const price = parseFloat(priceRaw);
    const inventoryQty = parseInt((formData.get('stock') as string) || '0');
    const category_id = (formData.get('category_id') as string) || null;
    const is_featured = formData.get('is_featured') === 'on';
    const is_bestseller = formData.get('is_bestseller') === 'on';
    const is_active = formData.get('is_active') !== 'off'; // default true
    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? imagesRaw.split(',').map(img => img.trim()).filter(Boolean)
        : [];

    // Slug: use provided or auto-generate from name
    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '');

    if (!name || isNaN(price)) throw new Error("Product name and price are required.");

    const { data: product, error } = await supabase
        .from('products')
        .insert([{
            name,
            slug,
            description,
            price,
            inventory: inventoryQty,
            stock: inventoryQty,
            images,
            is_featured,
            is_bestseller,
            is_active,
            ...(category_id ? { category_id } : {}),
        }])
        .select()
        .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);

    // Save variants if provided
    const variantsRaw = formData.get('variants') as string;
    if (variantsRaw && product) {
        await upsertVariants(supabase, product.id, JSON.parse(variantsRaw));
    }

    revalidatePaths(product?.id);
    return product;
}

export async function updateProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
    const price = parseFloat(priceRaw);
    const inventoryQty = parseInt((formData.get('stock') as string) || '0');
    const category_id = (formData.get('category_id') as string) || null;
    const is_featured = formData.get('is_featured') === 'on';
    const is_bestseller = formData.get('is_bestseller') === 'on';
    const is_active = formData.get('is_active') !== 'off';
    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? imagesRaw.split(',').map(img => img.trim()).filter(Boolean)
        : [];

    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '');

    if (!id) throw new Error("Product ID is required for update.");

    const { error } = await supabase
        .from('products')
        .update({
            name,
            slug,
            description,
            price,
            inventory: inventoryQty,
            stock: inventoryQty,
            images,
            is_featured,
            is_bestseller,
            is_active,
            category_id: category_id || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(`Failed to update product: ${error.message}`);

    // Save variants if provided
    const variantsRaw = formData.get('variants') as string;
    if (variantsRaw) {
        await upsertVariants(supabase, id, JSON.parse(variantsRaw));
    }

    revalidatePaths(id);
}

export async function deleteProduct(id: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
    revalidatePaths();
}

// ─────────────────────────────────────────────────
// VARIANT HELPER
// ─────────────────────────────────────────────────

interface VariantInput {
    id?: string
    name: string
    variant_type: 'shade' | 'size' | 'bundle' | 'type'
    price_override: number | null
    stock_quantity: number
    is_active: boolean
    _isNew?: boolean
}

async function upsertVariants(
    supabase: Awaited<ReturnType<typeof createAdminClient>>,
    productId: string,
    variants: VariantInput[]
) {
    for (const v of variants) {
        if (v.id && !v._isNew) {
            // Update existing
            await supabase
                .from('variants')
                .update({
                    name: v.name,
                    variant_type: v.variant_type,
                    price_override: v.price_override,
                    stock_quantity: v.stock_quantity,
                    is_active: v.is_active,
                })
                .eq('id', v.id);
        } else {
            // Insert new
            await supabase
                .from('variants')
                .insert({
                    product_id: productId,
                    name: v.name,
                    variant_type: v.variant_type,
                    price_override: v.price_override,
                    stock_quantity: v.stock_quantity,
                    is_active: v.is_active,
                });
        }
    }
}

export async function deleteVariant(variantId: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase.from('variants').delete().eq('id', variantId);
    if (error) throw new Error(`Failed to delete variant: ${error.message}`);
    revalidatePath('/admin/products');
}

// ─────────────────────────────────────────────────
// ORDER ACTIONS
// ─────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

function revalidatePaths(productId?: string) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/vault');
    revalidatePath('/shop');
    revalidatePath('/collections');
    revalidatePath('/category/face');
    revalidatePath('/category/eyes');
    revalidatePath('/category/lips');
    revalidatePath('/category/tools');
    revalidatePath('/');
    if (productId) {
        revalidatePath(`/shop/${productId}`);
    }
}
