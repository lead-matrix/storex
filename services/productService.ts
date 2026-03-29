import 'server-only';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import type { ProductCard, ProductWithVariants } from '@/types/product';

// ── In-process cache (auto-clears on redeploy) ─────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _cachedProducts: ProductCard[] | null = null;
let _cacheTs = 0;

/**
 * productService
 * All product read/write business logic lives here.
 * API routes and Server Actions must only call these functions — no direct DB queries.
 */

/** Return all active, in-stock products formatted as ProductCards */
export async function getProducts(): Promise<ProductCard[]> {
  const now = Date.now();
  if (_cachedProducts && now - _cacheTs < CACHE_TTL_MS) return _cachedProducts;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, base_price, sale_price, on_sale, images, stock, is_featured, is_bestseller, is_new, status')
    .eq('status', 'active')
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`productService.getProducts: ${error.message}`);

  const formatted: ProductCard[] = (data ?? []).map(mapToCard);
  _cachedProducts = formatted;
  _cacheTs = now;
  return formatted;
}

/** Invalidate the in-process cache (call after any product mutation) */
export function invalidateProductCache() {
  _cachedProducts = null;
  _cacheTs = 0;
}

/** Get a single product by slug with its variants and category */
export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:category_id ( name, slug ),
      variants:product_variants (
        id, product_id, name, variant_type, sku, price_override, stock, color_code, image_url, weight, status, created_at, updated_at
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new Error(`productService.getProductBySlug: ${error.message}`);
  if (!data) return null;

  return {
    ...data,
    variants: (data.variants ?? []).filter((v: any) => v.status === 'active'),
  } as unknown as ProductWithVariants;
}

/** Get a single product by ID */
export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:category_id ( name, slug ),
      variants:product_variants (
        id, product_id, name, variant_type, sku, price_override, stock, color_code, image_url, weight, status, created_at, updated_at
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`productService.getProductById: ${error.message}`);
  if (!data) return null;

  return {
    ...data,
    variants: data.variants ?? [],
  } as unknown as ProductWithVariants;
}

/** Get a variant by SKU */
export async function getVariantBySKU(sku: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('product_variants')
    .select('*, product:product_id ( title, images )')
    .eq('sku', sku)
    .maybeSingle();

  if (error) throw new Error(`productService.getVariantBySKU: ${error.message}`);
  return data;
}

/** Get featured products for the homepage hero */
export async function getFeaturedProducts(limit = 6): Promise<ProductCard[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, base_price, sale_price, on_sale, images, stock, is_featured, is_bestseller, is_new, status')
    .eq('status', 'active')
    .eq('is_featured', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`productService.getFeaturedProducts: ${error.message}`);
  return (data ?? []).map(mapToCard);
}

/** Get bestseller products */
export async function getBestsellerProducts(limit = 12): Promise<ProductCard[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, base_price, sale_price, on_sale, images, stock, is_featured, is_bestseller, is_new, status')
    .eq('status', 'active')
    .eq('is_bestseller', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`productService.getBestsellerProducts: ${error.message}`);
  return (data ?? []).map(mapToCard);
}

/** Typed search across title + description */
export async function searchProducts(query: string, limit = 20): Promise<ProductCard[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, base_price, sale_price, on_sale, images, stock, is_featured, is_bestseller, is_new, status')
    .eq('status', 'active')
    .ilike('title', `%${query}%`)
    .gt('stock', 0)
    .limit(limit);

  if (error) throw new Error(`productService.searchProducts: ${error.message}`);
  return (data ?? []).map(mapToCard);
}

// ── Internal helpers ─────────────────────────────────────────────────────────
function mapToCard(p: any): ProductCard {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: p.on_sale && p.sale_price != null ? Number(p.sale_price) : Number(p.base_price),
    base_price: Number(p.base_price),
    sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    on_sale: p.on_sale,
    image_url: p.images?.[0] ?? '',
    images: p.images ?? [],
    stock: p.stock,
    is_featured: p.is_featured,
    is_bestseller: p.is_bestseller,
    is_new: p.is_new,
  };
}
