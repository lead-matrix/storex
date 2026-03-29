// ── Shared Product & Variant Types ──────────────────────────────────────────
// Single source of truth for all product-related shapes across the application.

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  variant_type: string;
  sku: string;
  price_override: number | null;
  stock: number;
  color_code: string | null;
  image_url: string | null;
  weight: number | null; // oz
  status: 'active' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  on_sale: boolean;
  stock: number;
  images: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  status: 'active' | 'draft';
  weight_oz: number | null;
  category_id: string | null;
  sku: string | null;
  country_of_origin: string | null;
  customs_value_usd: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category?: { name: string; slug: string } | null;
}

/** Minimal shape used in listings / cards */
export interface ProductCard {
  id: string;
  title: string;
  slug: string | null;
  price: number;           // Effective display price (sale or base)
  base_price: number;
  sale_price: number | null;
  on_sale: boolean;
  image_url: string;
  images: string[];
  stock: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
}

/** Cart item sent from the browser to the checkout API */
export interface CartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  name?: string;
  price?: number;
  variant_weight_oz?: number | null;
  product_weight_oz?: number | null;
}
