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
                weight_grams: parseFloat(formData.get('weight_grams') as string) || null,
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
                        if (!variantSku) {
                            const vPrefix = (v.title || v.name || 'VAR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                            variantSku = `${sku}-${vPrefix}`;
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
            weight_grams: parseFloat(formData.get('weight_grams') as string) || null,
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
            if (!variantSku) {
                const vPrefix = (v.title || v.name || 'VAR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                variantSku = `${sku}-${vPrefix}`;
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

        // Rule 49: Log movement
        await supabase.from('inventory_movements').insert({
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
            // Rule 49: Log movement (approximate for v1)
            await supabase.from('inventory_movements').insert({
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
            totalAmount: Number(order.amount_total),
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
    const logo_url = formData.get('logo_url') as string;
    const storeEnabled = formData.get('storeEnabled') === 'on' || formData.get('storeEnabled') === 'true';

    const warehouseJson = formData.get('warehouse_info') as string;

    const { error: infoError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_info', setting_value: { name, tagline, currency, logo_url } }, { onConflict: 'setting_key' });

    if (infoError) throw infoError;

    if (warehouseJson) {
        const { error: whError } = await supabase
            .from('site_settings')
            .upsert({ setting_key: 'warehouse_info', setting_value: JSON.parse(warehouseJson) }, { onConflict: 'setting_key' });
        if (whError) throw whError;
    }

    const { error: enabledError } = await supabase
        .from('site_settings')
        .upsert({ setting_key: 'store_enabled', setting_value: storeEnabled }, { onConflict: 'setting_key' });

    if (enabledError) throw enabledError;

    revalidatePath('/admin/settings');
    revalidatePath('/collections');
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

export async function updateShippingSettings(formData: FormData) {
    const supabase = await ensureAdmin();

    const standard_rate = parseFloat(formData.get('standard_rate') as string) || 7.99;
    const express_rate = parseFloat(formData.get('express_rate') as string) || 19.99;
    const free_shipping_threshold = parseFloat(formData.get('free_shipping_threshold') as string) || 100;
    const express_label = (formData.get('express_label') as string) || 'Express Shipping';

    const { error } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'shipping_settings',
            setting_value: {
                standard_rate,
                express_rate,
                free_shipping_threshold,
                express_label,
                standard_label: 'Standard Shipping',
            },
        }, { onConflict: 'setting_key' });

    if (error) throw error;

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    return { success: true };
}

// ─────────────────────────────────────────────────
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

export async function updateFrontendContent(contentId: string, contentData: Record<string, string>) {
    const supabase = await ensureAdmin();

    const { error } = await supabase
        .from('frontend_content')
        .update({ content_data: contentData, updated_at: new Date().toISOString() })
        .eq('id', contentId);

    if (error) throw new Error(`Failed to update content: ${error.message}`);

    revalidatePath('/');
    revalidatePath('/admin/media');
    revalidatePath('/admin/settings');
}

export async function bulkUpdateCatalog(updates: {
    products?: { id: string, updates: any }[],
    variants?: { id: string, updates: any }[]
}) {
    const supabase = await ensureAdmin();

    try {
        if (updates.products && updates.products.length > 0) {
            for (const item of updates.products) {
                const { error } = await supabase
                    .from('products')
                    .update(item.updates)
                    .eq('id', item.id);
                if (error) throw error;
            }
        }

        if (updates.variants && updates.variants.length > 0) {
            for (const item of updates.variants) {
                const { error } = await supabase
                    .from('product_variants')
                    .update(item.updates)
                    .eq('id', item.id);
                if (error) throw error;
            }
        }

        revalidatePath('/admin/products');
        revalidatePath('/admin/products/catalog');
        return { success: true };
    } catch (err: any) {
        console.error("Bulk Update Error:", err);
        throw new Error(`Failed to apply batch updates: ${err.message}`);
    }
}

