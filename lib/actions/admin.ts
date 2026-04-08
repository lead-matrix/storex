'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createShippingLabel } from "@/lib/utils/shippo";
import { sendShippingNotificationEmail } from "@/lib/utils/email";

// Helper to ensure the user is an admin
async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Authentication required");

    const isOwner = user.email?.toLowerCase() === 'admin@dinacosmetic.store';

    const { createClient: createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = await createAdminClient();

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isOwner && profile?.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
    }

    return adminSupabase;
}

// ─────────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
    const supabase = await ensureAdmin();

    try {
        const title = formData.get('title') as string;
        const description = (formData.get('description') as string) || '';
        const priceRaw = (formData.get('base_price') || formData.get('price')) as string;
        let base_price = parseFloat(priceRaw) || 0;

        const stockRaw = formData.get('stock') as string;
        let stock = parseInt(stockRaw || '0') || 0;

        const category_id = (formData.get('category_id') as string) || null;

        const is_featured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true';
        const is_bestseller = formData.get('is_bestseller') === 'on' || formData.get('is_bestseller') === 'true';
        const is_new = formData.get('is_new') === 'on' || formData.get('is_new') === 'true';
        const on_sale = formData.get('on_sale') === 'on' || formData.get('on_sale') === 'true';

        const salePriceRaw = formData.get('sale_price') as string;
        let sale_price = salePriceRaw && salePriceRaw.trim() !== '' ? parseFloat(salePriceRaw) : null;

        const status = formData.get('status') as string || (formData.get('is_active') === 'false' ? 'draft' : 'active');

        const imagesRaw = formData.get('images') as string;
        const images = imagesRaw
            ? (imagesRaw.startsWith('[') ? JSON.parse(imagesRaw) : imagesRaw.split(',').map(img => img.trim()).filter(Boolean))
            : [];

        let slug = (formData.get('slug') as string)?.trim();
        if (!slug) {
            slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }

        if (!title) throw new Error("Product title is required.");

        let sku = (formData.get('sku') as string)?.trim();
        if (!sku) {
            const prefix = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DEF';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            sku = `DC-${prefix}-${randomSuffix}`;
        }

        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                title,
                slug,
                description,
                images,
                status,
                base_price,
                stock,
                category_id: category_id === '' ? null : category_id,
                is_featured,
                is_bestseller,
                is_new,
                on_sale,
                sale_price,
                weight_oz: parseFloat(formData.get('weight_oz') as string) || null,
                length_in: parseFloat(formData.get('length_in') as string) || null,
                width_in: parseFloat(formData.get('width_in') as string) || null,
                height_in: parseFloat(formData.get('height_in') as string) || null,
                sku: sku,
                country_of_origin: (formData.get('country_of_origin') as string)?.trim() || null,
                customs_value_usd: parseFloat(formData.get('customs_value_usd') as string) || null,
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create product: ${error.message}`);

        // Handle Variants
        const variantsJson = formData.get('variants') as string;
        if (variantsJson) {
            const variants = JSON.parse(variantsJson);
            if (Array.isArray(variants) && variants.length > 0) {
                const variantsToInsert = variants
                    .filter((v: any) => !v._deleted)
                    .map((v: any) => {
                        let variantSku = v.sku?.trim();
                        if (!variantSku || variantSku === '') {
                            const vPrefix = (v.title || v.name || 'VAR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                            variantSku = `${sku?.split('-')[0] || 'DC'}-${sku?.split('-')[1] || 'PROD'}-${vPrefix}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
                        }
                        return {
                            product_id: product.id,
                            name: v.title || v.name,
                            variant_type: v.variant_type || 'shade',
                            sku: variantSku,
                            price_override: v.price,
                            stock: v.stock,
                            color_code: v.color_code,
                            image_url: v.image_url,
                            weight: v.weight,
                        };
                    });
                await supabase.from('product_variants').insert(variantsToInsert);
            }
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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category_id = (formData.get('category_id') as string) || null;

    const status = formData.get('status') as string || (formData.get('is_active') === 'false' ? 'draft' : 'active');

    const imagesRaw = formData.get('images') as string;
    const images = imagesRaw
        ? (imagesRaw.startsWith('[') ? JSON.parse(imagesRaw) : imagesRaw.split(',').map(img => img.trim()).filter(Boolean))
        : [];

    const is_featured = formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true';
    const is_bestseller = formData.get('is_bestseller') === 'on' || formData.get('is_bestseller') === 'true';
    const is_new = formData.get('is_new') === 'on' || formData.get('is_new') === 'true';
    const on_sale = formData.get('on_sale') === 'on' || formData.get('on_sale') === 'true';

    const salePriceRaw = formData.get('sale_price') as string;
    let sale_price = salePriceRaw && salePriceRaw.trim() !== '' ? parseFloat(salePriceRaw) : null;

    let slug = (formData.get('slug') as string)?.trim();
    if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!id) throw new Error("Product ID is required for update.");

    let sku = (formData.get('sku') as string)?.trim();
    if (!sku) {
        const prefix = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DEF';
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        sku = `DC-${prefix}-${randomSuffix}`;
    }

    const { error } = await supabase
        .from('products')
        .update({
            title,
            slug,
            description,
            images,
            status,
            base_price: parseFloat(formData.get('base_price') as string) || 0,
            stock: parseInt(formData.get('stock') as string) || 0,
            category_id: category_id || null,
            is_featured,
            is_bestseller,
            is_new,
            on_sale,
            sale_price,
            weight_oz: parseFloat(formData.get('weight_oz') as string) || null,
            length_in: parseFloat(formData.get('length_in') as string) || null,
            width_in: parseFloat(formData.get('width_in') as string) || null,
            height_in: parseFloat(formData.get('height_in') as string) || null,
            sku: sku,
            country_of_origin: (formData.get('country_of_origin') as string)?.trim() || null,
            customs_value_usd: parseFloat(formData.get('customs_value_usd') as string) || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(`Failed to update product: ${error.message}`);

    // Handle Variants (Update/Insert/Delete)
    const variantsJson = formData.get('variants') as string;
    if (variantsJson) {
        const variants = JSON.parse(variantsJson);
        for (const v of variants) {
            let variantSku = v.sku?.trim();
            if (!variantSku || variantSku === '') {
                const vPrefix = (v.title || v.name || 'VAR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                variantSku = `${sku?.split('-')[0] || 'DC'}-${sku?.split('-')[1] || 'PROD'}-${vPrefix}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            }

            if (v._deleted && v.id) {
                await supabase.from('product_variants').delete().eq('id', v.id);
            } else if (v._isNew) {
                await supabase.from('product_variants').insert({
                    product_id: id,
                    name: v.title || v.name,
                    variant_type: v.variant_type || 'shade',
                    sku: variantSku,
                    price_override: v.price || v.price_override,
                    stock: v.stock,
                    color_code: v.color_code,
                    image_url: v.image_url,
                    weight: v.weight,
                });
            } else if (v.id) {
                await supabase.from('product_variants').update({
                    name: v.title || v.name,
                    variant_type: v.variant_type || 'shade',
                    sku: variantSku,
                    price_override: v.price || v.price_override,
                    stock: v.stock,
                    color_code: v.color_code,
                    image_url: v.image_url,
                    weight: v.weight,
                    status: v.status || 'active'
                }).eq('id', v.id);
            }
        }
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

export async function adjustStock(variantId: string, delta: number) {
    const supabase = await ensureAdmin();

    // 1. Try to find it in product_variants first (v2 schema)
    const { data: variant, error: variantErr } = await supabase
        .from('product_variants')
        .select('stock, product_id')
        .eq('id', variantId)
        .single();

    if (variant && !variantErr) {
        const newStock = Math.max(0, (variant.stock ?? 0) + delta);
        await supabase.from('product_variants').update({ stock: newStock }).eq('id', variantId);

        // Log movement to the correct table
        await supabase.from('inventory_logs').insert({
            variant_id: variantId,
            change_amount: delta,
            new_stock: newStock,
            reason: 'Manual Admin Adjustment',
            admin_id: (await supabase.auth.getUser()).data.user?.id
        });

        // Also fire off a reval for the product
        const { data: prod } = await supabase.from('products').select('slug').eq('id', variant.product_id).single();
        if (prod?.slug) revalidatePath(`/product/${prod.slug}`);
    } else {
        // 2. Fallback to base products table if it's a v1 product without variants
        const { data: prod } = await supabase.from('products').select('stock, slug').eq('id', variantId).single();
        if (!prod) throw new Error("Item not found in vault.");

        const newStock = Math.max(0, (prod.stock ?? 0) + delta);
        const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', variantId);

            if (!error) {
                    // Log movement
                    await supabase.from('inventory_logs').insert({
                        product_id: variantId,
                        change_amount: delta,
                        new_stock: newStock,
                        reason: 'Manual Admin Adjustment (Legacy Product)',
                        admin_id: (await supabase.auth.getUser()).data.user?.id
                    });
                }

        if (error) throw new Error(error.message);

        if (prod.slug) revalidatePath(`/product/${prod.slug}`);
    }

    revalidatePath('/admin/products');
}

export async function toggleProductStatus(id: string, currentStatus: string) {
    const supabase = await ensureAdmin();
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/products');
}

// Variant logic has been removed to align with flat product and inventory tables

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

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const { error } = await supabase
        .from('categories')
        .insert([{ name, slug }]);

    if (error) throw new Error(`Failed to create category: ${error.message}`);

    revalidatePaths(undefined, slug);
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await ensureAdmin();
    const name = formData.get('name') as string;
    const image_url = formData.get('image_url') as string | null;

    const { data: category } = await supabase.from('categories').select('slug').eq('id', id).single();

    const updateData: any = { name };
    if (image_url !== null) updateData.image_url = image_url;

    const { error } = await supabase
        .from('categories')
        .update(updateData)
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
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) throw new Error("Order not found");

    const shipping = await createShippingLabel(order);

    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: 'shipped',
            fulfillment_status: 'shipped',
            tracking_number: shipping.tracking_number,
            carrier: shipping.carrier || 'usps', // Ensure carrier is saved for webhook matching
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (updateError) throw new Error(updateError.message);

    const customerEmail = order.customer_email;
    const customerName =
        order.customer_name ||
        (order.shipping_address as any)?.name ||
        'Valued Client';

    if (customerEmail) {
        await sendShippingNotificationEmail({
            orderId,
            customerEmail,
            customerName,
            totalAmount: Number(order.amount_total),
            trackingNumber: shipping.tracking_number,
            labelUrl: shipping.label_url,
        }).catch((e: any) => console.error('[Email] Shipping notification failed:', e));
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

    // Send email notifications for key status transitions
    if (status === 'shipped' || status === 'delivered') {
        try {
            const { data: order } = await supabase
                .from('orders')
                .select('customer_email, customer_name, tracking_number, amount_total, shipping_address')
                .eq('id', orderId)
                .single();

            if (order?.customer_email) {
                const { sendShippingNotificationEmail, sendDeliveryNotificationEmail } = await import('@/lib/utils/email');
                const customerName =
                    order.customer_name ||
                    (order.shipping_address as any)?.name ||
                    'Valued Client';

                if (status === 'shipped') {
                    await sendShippingNotificationEmail({
                        orderId,
                        customerEmail: order.customer_email,
                        customerName,
                        totalAmount: Number(order.amount_total),
                        trackingNumber: order.tracking_number || undefined,
                    }).catch((e: any) => console.error('[Email] Shipping notification failed:', e));
                } else if (status === 'delivered') {
                    await sendDeliveryNotificationEmail({
                        orderId,
                        customerEmail: order.customer_email,
                        customerName,
                        totalAmount: Number(order.amount_total),
                    }).catch((e: any) => console.error('[Email] Delivery notification failed:', e));
                }
            }
        } catch (emailErr) {
            console.error('[Email] Status notification error (non-critical):', emailErr);
        }
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
}

// ─────────────────────────────────────────────────
// SETTINGS & SITE EDITOR
// ─────────────────────────────────────────────────

export async function updateStoreSettings(formData: FormData) {
    const supabase = await ensureAdmin();

    const name = formData.get('name') as string | null;
    const tagline = formData.get('tagline') as string | null;
    const currency = formData.get('currency') as string | null;
    const logo_url = formData.get('logo_url') as string | null;
    
    // Check if storeEnabled was even in the form before using its value
    const hasStoreEnabled = formData.has('storeEnabled');
    const storeEnabledRaw = formData.get('storeEnabled');
    const storeEnabled = storeEnabledRaw === 'on' || storeEnabledRaw === 'true';

    const warehouseJson = formData.get('warehouse_info') as string | null;

    // Handle store_info (merge if only some fields are present)
    if (name !== null || tagline !== null || currency !== null || logo_url !== null) {
        const { data: existingInfo } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'store_info')
            .maybeSingle();

        const newInfo = {
            ...(existingInfo?.setting_value || {}),
            ...(name !== null ? { name } : {}),
            ...(tagline !== null ? { tagline } : {}),
            ...(currency !== null ? { currency } : {}),
            ...(logo_url !== null ? { logo_url } : {}),
        };

        const { error } = await supabase
            .from('site_settings')
            .upsert({ setting_key: 'store_info', setting_value: newInfo }, { onConflict: 'setting_key' });
        if (error) throw error;
    }

    if (warehouseJson) {
        const { error: whError } = await supabase
            .from('site_settings')
            .upsert({ setting_key: 'warehouse_info', setting_value: JSON.parse(warehouseJson) }, { onConflict: 'setting_key' });
        if (whError) throw whError;
    }

    if (hasStoreEnabled) {
        const { error: enabledError } = await supabase
            .from('site_settings')
            .upsert({ setting_key: 'store_enabled', setting_value: storeEnabled }, { onConflict: 'setting_key' });
        if (enabledError) throw enabledError;
    }

    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return { success: true };
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

    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/collections');
    revalidatePath('/admin/settings');
    return { success: true };
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
    return { success: true };
}

export async function updateAnnouncementMessages(formData: FormData) {
    const supabase = await ensureAdmin();
    const str = formData.get('messages') as string;
    let messages: string[] = [];
    if (str) {
        try {
            messages = JSON.parse(str);
        } catch { }
    }
    
    await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'announcement_messages',
            setting_value: { messages },
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
        
    revalidatePath('/', 'page');
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function updateShippingSettings(formData: FormData) {
    const supabase = await ensureAdmin();

    const standard_rate = parseFloat(formData.get('standard_rate') as string) || 7.99;
    const express_rate = parseFloat(formData.get('express_rate') as string) || 29.99;
    const free_shipping_threshold = parseFloat(formData.get('free_shipping_threshold') as string) || 100;
    const standard_label = (formData.get('standard_label') as string) || 'Standard Shipping (5-10 Business Days)';
    const express_label = (formData.get('express_label') as string) || 'Express Shipping (2-4 Business Days)';

    let weight_brackets = [];
    let express_weight_brackets = [];
    let intl_weight_brackets = [];
    let intl_express_weight_brackets = [];

    try { weight_brackets = JSON.parse(formData.get('weight_brackets') as string || '[]'); } catch { }
    try { express_weight_brackets = JSON.parse(formData.get('express_weight_brackets') as string || '[]'); } catch { }
    try { intl_weight_brackets = JSON.parse(formData.get('intl_weight_brackets') as string || '[]'); } catch { }
    try { intl_express_weight_brackets = JSON.parse(formData.get('intl_express_weight_brackets') as string || '[]'); } catch { }

    const { error } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'shipping_settings',
            setting_value: {
                standard_rate,
                express_rate,
                free_shipping_threshold,
                standard_label,
                express_label,
                weight_brackets,
                express_weight_brackets,
                intl_weight_brackets,
                intl_express_weight_brackets
            },
        }, { onConflict: 'setting_key' });

    if (error) throw error;

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    return { success: true };
}

export async function updateHomeSections(formData: FormData) {
    const supabase = await ensureAdmin();

    // Fetch existing to avoid wiping out fields not present in this form/v4 schema
    const { data: existing } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'home_sections')
        .maybeSingle();

    const newValue = { ...(existing?.setting_value || {}) };

    // Only update keys that are actually in the form data
    if (formData.has('show_bestsellers')) {
        newValue.show_bestsellers = formData.get('show_bestsellers') === 'on' || formData.get('show_bestsellers') === 'true';
    }
    if (formData.has('show_bestsellers_hero')) {
        newValue.show_bestsellers_hero = formData.get('show_bestsellers_hero') === 'on' || formData.get('show_bestsellers_hero') === 'true';
    }
    if (formData.has('bestseller_heading')) {
        newValue.bestseller_heading = (formData.get('bestseller_heading') as string)?.trim();
    }
    if (formData.has('bestseller_subheading')) {
        newValue.bestseller_subheading = (formData.get('bestseller_subheading') as string)?.trim();
    }
    if (formData.has('show_featured')) {
        newValue.show_featured = formData.get('show_featured') === 'on' || formData.get('show_featured') === 'true';
    }
    if (formData.has('show_collections')) {
        newValue.show_collections = formData.get('show_collections') === 'on' || formData.get('show_collections') === 'true';
    }

    const { error } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'home_sections',
            setting_value: newValue,
        }, { onConflict: 'setting_key' });

    if (error) throw error;

    revalidatePath('/', 'page');
    revalidatePath('/admin/settings');
    return { success: true };
}


// HELPERS
// ─────────────────────────────────────────────────

function revalidatePaths(productId?: string, slug?: string) {
    try {
        // Admin list — must update immediately
        revalidatePath('/admin/products');
        revalidatePath('/admin');
        revalidatePath('/admin/dashboard');

        // Every major storefront page — products go live INSTANTLY
        revalidatePath('/', 'page');
        revalidatePath('/', 'layout');
        revalidatePath('/shop', 'page');
        revalidatePath('/collections', 'page');
        revalidatePath('/bestsellers', 'page');
        revalidatePath('/sale', 'page');
        revalidatePath('/[slug]', 'page');

        // Specific dynamic product page
        if (slug) {
            revalidatePath(`/product/${slug}`, 'page');
        }
        if (productId) {
            revalidatePath(`/product/${productId}`, 'page');
        }

        // Category browse pages — all of them
        revalidatePath('/category/[slug]', 'page');
        revalidatePath('/category/[slug]', 'layout');
        revalidatePath('/collections/[slug]', 'page');
    } catch (err) {
        console.error('Revalidation failed:', err);
    }
}

// ─────────────────────────────────────────────────
// MEDIA LIBRARY ACTIONS
// ─────────────────────────────────────────────────

export async function deleteStorageFile(filePath: string) {
    const supabase = await ensureAdmin();
    const { createClient: createAdminSupabase } = await import('@/lib/supabase/admin');
    const adminSupabase = await createAdminSupabase();

    const { error } = await adminSupabase.storage
        .from('product-images')
        .remove([filePath]);

    if (error) throw new Error(`Failed to delete file: ${error.message}`);
    revalidatePath('/admin/media');
}

export async function updateFrontendContent(contentKey: string, contentData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await ensureAdmin();
        const { error } = await supabase
            .from('frontend_content')
            .update({ content_data: contentData, updated_at: new Date().toISOString() })
            .eq('content_key', contentKey);
        if (error) return { success: false, error: error.message };
        revalidatePath('/', 'page');
        revalidatePath('/', 'layout');
        revalidatePath('/about');
        revalidatePath('/[slug]', 'page');
        revalidatePath('/admin/media');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function bulkUpdateCatalog(updates: {
    products?: { id: string, updates: any }[],
    variants?: { id: string, updates: any }[]
}) {
    const supabase = await ensureAdmin();

    try {
        if (updates.products && updates.products.length > 0) {
            const { error } = await supabase
                .from('products')
                .upsert(
                    updates.products.map(({ id, updates: u }) => ({ id, ...u })),
                    { onConflict: 'id' }
                );
            if (error) throw error;
        }

        if (updates.variants && updates.variants.length > 0) {
            const { error } = await supabase
                .from('product_variants')
                .upsert(
                    updates.variants.map(({ id, updates: u }) => ({ id, ...u })),
                    { onConflict: 'id' }
                );
            if (error) throw error;
        }

        revalidatePath('/admin/products');
        revalidatePath('/admin/products/catalog');
        return { success: true };
    } catch (err: any) {
        console.error("Bulk Update Error:", err);
        throw new Error(`Failed to apply batch updates: ${err.message}`);
    }
}

