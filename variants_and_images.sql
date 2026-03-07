-- ================================================================
--  DINA COSMETIC  ·  VARIANTS & IMAGES MIGRATION  ·  v1.1
--  Run once in Supabase SQL Editor.
--  Safe to re-run (fully idempotent).
--
--  FIX v1.1:  variants table still has a NOT NULL 'name' column
--             (the name→title rename in MASTER.sql hadn't run yet).
--             Every variant INSERT now writes BOTH name AND title.
-- ================================================================
-- ───────────────────────────────────────────────────────────────
-- §0  ENSURE name column exists (safety — no-op if already there)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.variants
ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.variants
ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.variants
ADD COLUMN IF NOT EXISTS image_url text;
-- ───────────────────────────────────────────────────────────────
-- §1  UPDATE CATEGORY IMAGES  (local /products/ paths)
-- ───────────────────────────────────────────────────────────────
UPDATE public.categories
SET image_url = '/products/Catgry-eye.jfif'
WHERE slug = 'eyes';
UPDATE public.categories
SET image_url = '/products/Catgry-lips.jfif'
WHERE slug = 'lips';
UPDATE public.categories
SET image_url = '/products/Catgry-tools.jfif'
WHERE slug = 'tools';
UPDATE public.categories
SET image_url = '/products/catgry-face.jfif'
WHERE slug = 'face';
-- ───────────────────────────────────────────────────────────────
-- §2  BRUSH SET  — 1 parent product + 14pcs / 18pcs variants
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE tools_id uuid;
brush_pid uuid;
BEGIN
SELECT id INTO tools_id
FROM public.categories
WHERE slug = 'tools';
-- Remove old separate products (children first to satisfy FK)
DELETE FROM public.variants
WHERE product_id IN (
        SELECT id
        FROM public.products
        WHERE slug IN ('brush-set-14', 'brush-set-18')
    );
DELETE FROM public.products
WHERE slug IN ('brush-set-14', 'brush-set-18');
-- Upsert single parent product
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Artisan Brush Set',
        'brush-set',
        15.00,
        'Professional-grade makeup brush set. Choose your edition — the essential 14pcs for daily rituals or the complete 18pcs for full artistic mastery.',
        tools_id,
        75,
        true,
        'active',
        ARRAY ['/products/Brush-set-cover.jpg','/products/brushes.png','/products/Brush-set-14pcs.jpg','/products/Brush-set-18pcs.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO brush_pid
FROM public.products
WHERE slug = 'brush-set';
-- Remove any existing variants for clean re-seed
DELETE FROM public.variants
WHERE product_id = brush_pid;
-- 14pcs variant  (name = title for backwards compat)
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        status
    )
VALUES (
        brush_pid,
        '14 Pieces',
        '14 Pieces',
        'size',
        15.00,
        45,
        'BRUSH-14',
        '/products/Brush-set-14pcs.jpg',
        'active'
    );
-- 18pcs variant
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        status
    )
VALUES (
        brush_pid,
        '18 Pieces',
        '18 Pieces',
        'size',
        20.00,
        30,
        'BRUSH-18',
        '/products/Brush-set-18pcs.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §3  SOLID CREAM LIPSTICK  — Classic & Marron colour variants
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE lips_id uuid;
prod_pid uuid;
BEGIN
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Solid Cream Lipstick',
        'solid-cream-lipstick',
        12.00,
        'Rich, creamy formula with long-lasting pigment. Available in Marron & Classic.',
        lips_id,
        120,
        true,
        'active',
        ARRAY ['/products/Solidcream-lipstick.jpg','/products/Solidcream-lipstick-marron.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO prod_pid
FROM public.products
WHERE slug = 'solid-cream-lipstick';
DELETE FROM public.variants
WHERE product_id = prod_pid;
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        color_code,
        image_url,
        status
    )
VALUES (
        prod_pid,
        'Classic',
        'Classic',
        'shade',
        12.00,
        60,
        'SCL-CLASSIC',
        '#8B1A1A',
        '/products/Solidcream-lipstick.jpg',
        'active'
    ),
    (
        prod_pid,
        'Marron',
        'Marron',
        'shade',
        12.00,
        60,
        'SCL-MARRON',
        '#4E2020',
        '/products/Solidcream-lipstick-marron.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §4  SOLID MATTE LIPSTICK  — Royal & Bold Purple
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE lips_id uuid;
prod_pid uuid;
BEGIN
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Solid Matte Lipstick',
        'solid-matte-lipstick',
        12.00,
        'Intensely matte, velvety finish. Pick your statement shade — Royal or Bold Purple.',
        lips_id,
        100,
        false,
        'active',
        ARRAY ['/products/Solidmatte-lipstick-royal.jpg','/products/Solidmatte-lipstick-purple.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO prod_pid
FROM public.products
WHERE slug = 'solid-matte-lipstick';
DELETE FROM public.variants
WHERE product_id = prod_pid;
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        color_code,
        image_url,
        status
    )
VALUES (
        prod_pid,
        'Royal',
        'Royal',
        'shade',
        12.00,
        50,
        'SML-ROYAL',
        '#4169E1',
        '/products/Solidmatte-lipstick-royal.jpg',
        'active'
    ),
    (
        prod_pid,
        'Bold Purple',
        'Bold Purple',
        'shade',
        12.00,
        50,
        'SML-PURPLE',
        '#6B238E',
        '/products/Solidmatte-lipstick-purple.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §5  SOLID LIPSTICK  — Abricot & Light Pink
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE lips_id uuid;
prod_pid uuid;
BEGIN
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Solid Lipstick',
        'solid-lipstick',
        10.00,
        'Lightweight but bold solid lipstick. Choose your mood — Abricot nude warmth or Light Pink freshness.',
        lips_id,
        120,
        false,
        'active',
        ARRAY ['/products/Solidlipstick-abrico.jpg','/products/Solidlipstick-lightpink.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO prod_pid
FROM public.products
WHERE slug = 'solid-lipstick';
DELETE FROM public.variants
WHERE product_id = prod_pid;
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        color_code,
        image_url,
        status
    )
VALUES (
        prod_pid,
        'Abricot',
        'Abricot',
        'shade',
        10.00,
        60,
        'SL-ABRICO',
        '#FFAA80',
        '/products/Solidlipstick-abrico.jpg',
        'active'
    ),
    (
        prod_pid,
        'Light Pink',
        'Light Pink',
        'shade',
        10.00,
        60,
        'SL-LPINK',
        '#FFB6C1',
        '/products/Solidlipstick-lightpink.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §6  LIQUID MATTE LIPSTICK  — Classic Red / Deep Matte / Matte Nude
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE lips_id uuid;
prod_pid uuid;
BEGIN
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Liquid Matte Lipstick',
        'liquid-matte-lipstick',
        14.00,
        'High-impact liquid colour with a bold matte finish. Ultra-pigmented for all-day wear.',
        lips_id,
        130,
        true,
        'active',
        ARRAY ['/products/Liquidmatte-lipstick.jpg','/products/matte-lipstick.jpg','/products/matte-liquid-lipstick.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO prod_pid
FROM public.products
WHERE slug = 'liquid-matte-lipstick';
DELETE FROM public.variants
WHERE product_id = prod_pid;
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        color_code,
        image_url,
        status
    )
VALUES (
        prod_pid,
        'Classic Red',
        'Classic Red',
        'shade',
        14.00,
        45,
        'LML-RED',
        '#CC0000',
        '/products/Liquidmatte-lipstick.jpg',
        'active'
    ),
    (
        prod_pid,
        'Deep Matte',
        'Deep Matte',
        'shade',
        14.00,
        45,
        'LML-DEEP',
        '#8B0000',
        '/products/matte-lipstick.jpg',
        'active'
    ),
    (
        prod_pid,
        'Matte Nude',
        'Matte Nude',
        'shade',
        14.00,
        40,
        'LML-NUDE',
        '#C68B77',
        '/products/matte-liquid-lipstick.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §7  LIQUID LIP COLOUR  — 5 shades
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE lips_id uuid;
prod_pid uuid;
BEGIN
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
INSERT INTO public.products (
        title,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        status,
        images
    )
VALUES (
        'Liquid Lip Colour',
        'liquid-lip-colour',
        13.00,
        'Precision-tip liquid lip colour in 5 curated shades — from bold reds to soft nudes and a glossy finish.',
        lips_id,
        200,
        false,
        'active',
        ARRAY ['/products/Liq-lip-abrico.jpg','/products/Liq-lip-burgundy.jpg','/products/liq-lip-Rose-matte.jpg','/products/liq-lip-red.jpg','/products/liq-lip-gloss.jpg']
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    images = EXCLUDED.images;
SELECT id INTO prod_pid
FROM public.products
WHERE slug = 'liquid-lip-colour';
DELETE FROM public.variants
WHERE product_id = prod_pid;
INSERT INTO public.variants (
        product_id,
        name,
        title,
        variant_type,
        price_override,
        stock,
        sku,
        color_code,
        image_url,
        status
    )
VALUES (
        prod_pid,
        'Abricot',
        'Abricot',
        'shade',
        13.00,
        40,
        'LLC-ABRICO',
        '#FFAA70',
        '/products/Liq-lip-abrico.jpg',
        'active'
    ),
    (
        prod_pid,
        'Burgundy',
        'Burgundy',
        'shade',
        13.00,
        40,
        'LLC-BURG',
        '#800020',
        '/products/Liq-lip-burgundy.jpg',
        'active'
    ),
    (
        prod_pid,
        'Rose Matte',
        'Rose Matte',
        'shade',
        13.00,
        40,
        'LLC-ROSE',
        '#C8637A',
        '/products/liq-lip-Rose-matte.jpg',
        'active'
    ),
    (
        prod_pid,
        'Red',
        'Red',
        'shade',
        13.00,
        40,
        'LLC-RED',
        '#CC0000',
        '/products/liq-lip-red.jpg',
        'active'
    ),
    (
        prod_pid,
        'Gloss',
        'Gloss',
        'shade',
        14.00,
        40,
        'LLC-GLOSS',
        '#FFB6BC',
        '/products/liq-lip-gloss.jpg',
        'active'
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §8  PATCH EXISTING matte-lipstick product images
-- ───────────────────────────────────────────────────────────────
UPDATE public.products
SET images = ARRAY ['/products/Liquidmatte-lipstick.jpg','/products/matte-lipstick.jpg']
WHERE slug = 'matte-lipstick';
-- ───────────────────────────────────────────────────────────────
-- §9  UPDATE HERO BANNER IMAGE
-- ───────────────────────────────────────────────────────────────
UPDATE public.frontend_content
SET content_data = content_data || '{"image_url":"/products/Banner-1.jpg"}'::jsonb
WHERE content_key = 'hero_main';
-- ───────────────────────────────────────────────────────────────
-- §10  FREE-SHIPPING THRESHOLD → $100  (site_settings + CMS)
-- ───────────────────────────────────────────────────────────────
UPDATE public.site_settings
SET setting_value = '{"free_threshold":100,"flat_rate":9.99,"free_label":"Free Shipping on orders over $100","carrier":"USPS"}'::jsonb,
    updated_at = now()
WHERE setting_key = 'shipping';
UPDATE public.frontend_content
SET content_data = content_data || '{"text":"Free Shipping on orders over $100","cta_text":"Shop Now","cta_link":"/shop","is_active":true,"bg_color":"#D4AF37"}'::jsonb,
    updated_at = now()
WHERE content_key = 'announcement_banner';
UPDATE public.frontend_content
SET content_data = '{"items":[{"icon":"Truck","title":"Complimentary Delivery","description":"On all orders exceeding $100"},{"icon":"RotateCcw","title":"Effortless Returns","description":"30-day elegant exchange protocol"},{"icon":"Award","title":"Authentic Masterpieces","description":"Guaranteed direct from the Palace"},{"icon":"Shield","title":"Secure Encrypted Transport","description":"Uncompromised transaction safety"}]}'::jsonb,
    updated_at = now()
WHERE content_key = 'trust_indicators';
-- ───────────────────────────────────────────────────────────────
-- §11  SAFETY — ensure no zero-stock rows
-- ───────────────────────────────────────────────────────────────
UPDATE public.products
SET stock = 50
WHERE stock IS NULL
    OR stock <= 0;
UPDATE public.variants
SET stock = 30
WHERE stock IS NULL
    OR stock <= 0;
-- Sync name → title on any older rows that were inserted with only name
UPDATE public.variants
SET title = name
WHERE title IS NULL
    AND name IS NOT NULL;
UPDATE public.variants
SET name = title
WHERE name IS NULL
    AND title IS NOT NULL;
-- ───────────────────────────────────────────────────────────────
-- §12  VERIFICATION
-- ───────────────────────────────────────────────────────────────
SELECT p.slug,
    p.title,
    COUNT(v.id) AS variant_count,
    string_agg(
        v.title || ' (' || v.variant_type || ')',
        ', '
        ORDER BY v.title
    ) AS variants
FROM public.products p
    LEFT JOIN public.variants v ON v.product_id = p.id
WHERE p.slug IN (
        'brush-set',
        'solid-cream-lipstick',
        'solid-matte-lipstick',
        'solid-lipstick',
        'liquid-matte-lipstick',
        'liquid-lip-colour'
    )
GROUP BY p.slug,
    p.title
ORDER BY p.slug;