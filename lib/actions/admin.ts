'use server'

import { createClient as createAdminClient } from "@/utils/supabase/admin";
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

    try {
        const name = formData.get('name') as string;
        const description = (formData.get('description') as string) || '';
        const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
        let base_price = parseFloat(priceRaw);
        if (isNaN(base_price)) base_price = 0;

        const stockRaw = formData.get('stock') as string;
        let stock = parseInt(stockRaw || '0');
        if (isNaN(stock)) stock = 0;

        const category_id = (formData.get('category_id') as string) || null;

        // Boolean logic handling for standard checkboxes/switches
        const is_featured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true';
        const is_bestseller = formData.get('is_bestseller') === 'on' || formData.get('is_bestseller') === 'true';
        const is_new = formData.get('is_new') === 'on' || formData.get('is_new') === 'true';
        const on_sale = formData.get('on_sale') === 'on' || formData.get('on_sale') === 'true';

        const salePriceRaw = formData.get('sale_price') as string;
        let sale_price = salePriceRaw && salePriceRaw.trim() !== '' ? parseFloat(salePriceRaw) : null;
        if (sale_price !== null && isNaN(sale_price)) sale_price = null;

        // Fix: is_active should default to true on creation if field is missing (Quick Add)
        // Switch component sends nothing when unchecked, so we check for existence
        const is_active = formData.has('is_active')
            ? (formData.get('is_active') === 'on' || formData.get('is_active') === 'true')
            : true;

        // Explicit images handling
        const imagesRaw = formData.get('images') as string;
        const images = imagesRaw
            ? (imagesRaw.startsWith('[') ? JSON.parse(imagesRaw) : imagesRaw.split(',').map(img => img.trim()).filter(Boolean))
            : [];

        // Slug: use provided or auto-generate from name
        let slug = (formData.get('slug') as string)?.trim();
        if (!slug) {
            slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        if (!name) throw new Error("Product name is required.");

        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                name,
                slug,
                description,
                base_price,
                stock,
                images,
                is_featured,
                is_bestseller,
                is_new,
                on_sale,
                sale_price,
                is_active,
                category_id: category_id === '' ? null : category_id,
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create product: ${error.message}`);

        // Save variants if provided
        const variantsRaw = formData.get('variants') as string;
        if (variantsRaw && product) {
            await upsertVariants(supabase, product.id, JSON.parse(variantsRaw));
        }

        revalidatePaths(product?.id, product?.slug);
        return product;
    } catch (err: any) {
        console.error("Error in createProduct:", err);
        throw err;
    }
}

export async function updateProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const basePriceRaw = (formData.get('base_price') || formData.get('price')) as string;
    const base_price = parseFloat(basePriceRaw);
    const stock = parseInt((formData.get('stock') as string) || '0');
    const category_id = (formData.get('category_id') as string) || null;

    // Boolean logic handling for standard checkboxes/switches
    const is_featured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true';
    const is_bestseller = formData.get('is_bestseller') === 'on' || formData.get('is_bestseller') === 'true';
    const is_new = formData.get('is_new') === 'on' || formData.get('is_new') === 'true';
    const on_sale = formData.get('on_sale') === 'on' || formData.get('on_sale') === 'true';
    const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

    const salePriceRaw = formData.get('sale_price') as string;
    const sale_price = salePriceRaw && salePriceRaw.trim() !== '' ? parseFloat(salePriceRaw) : null;

    // Explicit images handling
    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? (imagesRaw.startsWith('[') ? JSON.parse(imagesRaw) : imagesRaw.split(',').map(img => img.trim()).filter(Boolean))
        : [];

    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!id) throw new Error("Product ID is required for update.");

    const { error } = await supabase
        .from('products')
        .update({
            name,
            slug,
            description,
            base_price,
            stock,
            images,
            is_featured,
            is_bestseller,
            is_new,
            on_sale,
            sale_price,
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

    revalidatePaths(id, slug);
}

export async function deleteProduct(id: string) {
    const supabase = await ensureAdmin();
    const { data: product } = await supabase.from('products').select('slug').eq('id', id).single();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
    revalidatePaths(id, product?.slug);
}

export async function adjustStock(id: string, delta: number) {
    const supabase = await ensureAdmin();
    // Fetch product to get slug for revalidation
    const { data: product } = await supabase.from('products').select('slug, stock').eq('id', id).single();
    if (!product) throw new Error("Product not found");

    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePaths(id, product.slug);
}

export async function toggleProductStatus(id: string, current: boolean) {
    const supabase = await ensureAdmin();
    const { data: product } = await supabase.from('products').select('slug').eq('id', id).single();
    if (!product) throw new Error("Product not found");

    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePaths(id, product.slug);
}

// ─────────────────────────────────────────────────
// VARIANT HELPER
// ─────────────────────────────────────────────────

interface VariantInput {
    id?: string
    name: string
    variant_type: 'shade' | 'size' | 'bundle' | 'type'
    color_code?: string
    price_override: number | null
    stock: number
    is_active: boolean
    _isNew?: boolean
}

async function upsertVariants(
    supabase: Awaited<ReturnType<typeof createAdminClient>>,
    productId: string,
    variants: VariantInput[]
) {
    for (const v of variants) {
        let price_override = v.price_override;
        if (price_override !== null && isNaN(price_override)) price_override = null;

        let stock = v.stock;
        if (isNaN(stock)) stock = 0;

        if (v.id && !v._isNew) {
            // Update existing
            const { error } = await supabase
                .from('variants')
                .update({
                    name: v.name,
                    variant_type: v.variant_type,
                    color_code: v.color_code,
                    price_override,
                    stock,
                    is_active: v.is_active,
                })
                .eq('id', v.id);
            if (error) console.error("Error updating variant:", error);
        } else {
            // Insert new
            const { error } = await supabase
                .from('variants')
                .insert({
                    product_id: productId,
                    name: v.name,
                    variant_type: v.variant_type,
                    color_code: v.color_code,
                    price_override,
                    stock,
                    is_active: v.is_active,
                });
            if (error) console.error("Error inserting variant:", error);
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
// USER MANAGEMENT
// ─────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    revalidatePath('/admin/users');
}

// ─────────────────────────────────────────────────
// CATEGORY CRUD
// ─────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
    const supabase = await ensureAdmin();
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';

    // Better slug generation
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const { error } = await supabase
        .from('categories')
        .insert([{ name, description, slug }]);

    if (error) throw new Error(`Failed to create category: ${error.message}`);

    revalidatePaths(undefined, slug);
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await ensureAdmin();
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';

    const { data: category } = await supabase.from('categories').select('slug').eq('id', id).single();

    const { error } = await supabase
        .from('categories')
        .update({ name, description })
        .eq('id', id);

    if (error) throw new Error(`Failed to update category: ${error.message}`);

    revalidatePaths(undefined, category?.slug);
}

export async function deleteCategory(id: string) {
    const supabase = await ensureAdmin();
    const { data: category } = await supabase.from('categories').select('slug').eq('id', id).single();

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete category: ${error.message}`);

    revalidatePaths(undefined, category?.slug);
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
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
}

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await ensureAdmin();
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/orders');
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
}

// ─────────────────────────────────────────────────
// SETTINGS & SITE EDITOR
// ─────────────────────────────────────────────────

export async function updateStoreSettings(formData: FormData) {
    const supabase = await ensureAdmin();

    const name = formData.get('name') as string;
    const tagline = formData.get('tagline') as string;
    const currency = formData.get('currency') as string;
    const storeEnabled = formData.get('storeEnabled') === 'on' || formData.get('storeEnabled') === 'true';

    const { error: infoError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_info', setting_value: { name, tagline, currency } });

    if (infoError) throw infoError;

    const { error: enabledError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_enabled', setting_value: storeEnabled });

    if (enabledError) throw enabledError;

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
}

export async function updateHeroContent(formData: FormData) {
    const supabase = await ensureAdmin();

    const title = formData.get('hero_title') as string;
    const subtitle = formData.get('hero_subtitle') as string;
    const slidesJson = formData.get('hero_slides') as string;

    // Update single-hero legacy content
    await supabase
        .from('frontend_content')
        .update({ content_data: { title, subtitle }, updated_at: new Date().toISOString() })
        .eq('content_key', 'hero_main');

    // Update dynamic slides if provided
    if (slidesJson) {
        try {
            const slides = JSON.parse(slidesJson);
            await supabase
                .from('frontend_content')
                .upsert({
                    content_key: 'hero_slides',
                    content_data: { slides },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'content_key' });
        } catch (e) {
            console.error("Hero slides JSON error:", e);
        }
    }

    revalidatePath('/');
    revalidatePath('/admin/settings');
}

export async function updateMenusAndSocials(formData: FormData) {
    const supabase = await ensureAdmin();

    const headerStr = formData.get('header_nav') as string;
    const footerStr = formData.get('footer_legal') as string;
    const instagram = (formData.get('instagram') as string) || '';
    const tiktok = (formData.get('tiktok') as string) || '';
    const facebook = (formData.get('facebook') as string) || '';

    if (headerStr) {
        try {
            await supabase
                .from('navigation_menus')
                .update({ menu_items: JSON.parse(headerStr), updated_at: new Date().toISOString() })
                .eq('menu_key', 'header_main');
        } catch { /* ignore JSON parse errors */ }
    }

    if (footerStr) {
        try {
            await supabase
                .from('navigation_menus')
                .update({ menu_items: JSON.parse(footerStr), updated_at: new Date().toISOString() })
                .eq('menu_key', 'footer_legal');
        } catch { /* ignore JSON parse errors */ }
    }

    await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'social_media',
            setting_value: { instagram, tiktok, facebook },
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

function revalidatePaths(productId?: string, slug?: string) {
    try {
        // Essential paths for admin visibility
        revalidatePath('/admin/products');
        revalidatePath('/admin');

        // Essential paths for shop visibility
        revalidatePath('/');
        revalidatePath('/shop');
        revalidatePath('/collections');

        // Specific dynamic paths
        if (slug) {
            revalidatePath(`/product/${slug}`, 'page');
        }

        if (productId) {
            revalidatePath(`/product/${productId}`, 'page');
        }

        // Revalidate layout to clear cached navigation or category items
        revalidatePath('/category/[slug]', 'layout');
        revalidatePath('/(shop)/[slug]', 'layout');
    } catch (err) {
        console.error("Revalidation failed:", err);
    }
}
