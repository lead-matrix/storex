-- ============================================================
--  LMXEngine · DINA COSMETIC · LUXURY MOCKUP SEED
--  Aligns DB with the Obsidian Palace Branding Mockup
-- ============================================================

-- 1. CLEANUP (Optional: removes existing featured products to focus on mockup)
-- UPDATE public.products SET is_featured = false;

-- 2. INSERT MOCKUP PRODUCTS
INSERT INTO public.products (id, name, slug, base_price, images, description, is_featured, is_active, stock)
VALUES 
  (
    gen_random_uuid(), 
    'LUXURIOUS FOUNDATION', 
    'luxurious-foundation', 
    49.99, 
    ARRAY['/luxury_foundation_product_1772222449729.png'], 
    'An ultra-refined liquid foundation that provides flawless coverage with a weightless, obsidian-smooth finish.', 
    true, 
    true, 
    100
  ),
  (
    gen_random_uuid(), 
    'RADIANT LIPSTICK', 
    'radiant-lipstick', 
    29.99, 
    ARRAY['/radiant_lipstick_product_1772222471480.png'], 
    'Highly pigmented, creamy lipstick that delivers intense color and long-lasting radiance in a single swipe.', 
    true, 
    true, 
    150
  ),
  (
    gen_random_uuid(), 
    'BEAUTY SERUM', 
    'beauty-serum', 
    59.99, 
    ARRAY['/beauty_serum_product_1772222488120.png'], 
    'A powerful serum infused with rare obsidian extracts to rejuvenate and brighten your skin from within.', 
    true, 
    true, 
    80
  ),
  (
    gen_random_uuid(), 
    'ELEGANT PERFUME', 
    'elegant-perfume', 
    79.99, 
    ARRAY['/elegant_perfume_product_1772222507123.png'], 
    'A sophisticated fragrance that captures the essence of luxury—dark, floral, and absolutely unforgettable.', 
    true, 
    true, 
    50
  )
ON CONFLICT (slug) DO UPDATE 
SET 
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  images = EXCLUDED.images,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active;

-- 3. ENSURE REQUISITE CATEGORY (Optional)
-- INSERT INTO public.categories (id, name, slug) 
-- VALUES (gen_random_uuid(), 'Obsidian Collection', 'obsidian-collection')
-- ON CONFLICT (slug) DO NOTHING;
