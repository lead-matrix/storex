-- ============================================================
--  DINA COSMETIC — DB MIGRATION V2
--  Category + Product Logic Lock
--
--  Idempotent (safe to run multiple times).
--  Run AFTER DATABASE_FINAL.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND TABLES
-- ─────────────────────────────────────────────────────────────

-- products: add slug, is_bestseller, is_active if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug         text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active    boolean NOT NULL DEFAULT true;

-- Backfill slugs for existing products that have none
UPDATE public.products
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slug unique (add unique constraint if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_key' AND conrelid = 'public.products'::regclass
  ) THEN
    -- Deduplicate first to be safe
    UPDATE public.products p1
    SET slug = slug || '-' || SUBSTRING(id::text, 1, 6)
    WHERE EXISTS (
      SELECT 1 FROM public.products p2
      WHERE p2.slug = p1.slug AND p2.id < p1.id
    );
    ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END$$;

-- categories: add is_active if missing
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- variants: add variant_type enum column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variant_type_enum') THEN
    CREATE TYPE public.variant_type_enum AS ENUM ('shade', 'size', 'bundle', 'type');
  END IF;
END$$;

ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS variant_type public.variant_type_enum;
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_slug         ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured  ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products(is_bestseller);
CREATE INDEX IF NOT EXISTS idx_categories_is_active  ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_is_active    ON public.variants(is_active);

-- ─────────────────────────────────────────────────────────────
-- 3. SEED ROOT CATEGORIES (idempotent via ON CONFLICT)
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.categories (name, slug, description, is_active) VALUES
  ('Face',               'face',  'Foundations, contouring, and face essentials for a flawless canvas.', true),
  ('Eyes',               'eyes',  'Eyeshadow, mascara, and brow products for expressive, defined eyes.', true),
  ('Lips',               'lips',  'Lipsticks and glosses in rich, long-lasting shades.', true),
  ('Tools & Accessories','tools', 'Professional brushes and makeup accessories for a perfect finish.', true)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active   = EXCLUDED.is_active;

-- ─────────────────────────────────────────────────────────────
-- 4. SEED PRODUCTS WITH CORRECT PRICING
--    Each product gets a unique slug, correct category, and base_price.
--    ON CONFLICT (slug) → update price to lock pricing.
-- ─────────────────────────────────────────────────────────────

-- Helper: grab category IDs
DO $$
DECLARE
  face_id  uuid;
  eyes_id  uuid;
  lips_id  uuid;
  tools_id uuid;
BEGIN
  SELECT id INTO face_id  FROM public.categories WHERE slug = 'face'  LIMIT 1;
  SELECT id INTO eyes_id  FROM public.categories WHERE slug = 'eyes'  LIMIT 1;
  SELECT id INTO lips_id  FROM public.categories WHERE slug = 'lips'  LIMIT 1;
  SELECT id INTO tools_id FROM public.categories WHERE slug = 'tools' LIMIT 1;

  -- FACE PRODUCTS
  INSERT INTO public.products (name, slug, description, price, inventory, category_id, is_active, is_featured, images) VALUES
    ('Eyeshadow Palette',        'eyeshadow-palette',      'Richly pigmented palette with 12 versatile shades.',      25.00,  50, eyes_id,  true, true,  '{}'),
    ('Contour Stick',            'contour-stick',          'Sculpting contour stick for seamless definition.',         12.99,  80, face_id,  true, false, '{}'),
    ('Face Primer',              'face-primer',            'Silky primer that smooths and primes skin for all-day wear.',15.00,  60, face_id,  true, true,  '{}'),
    ('Setting Spray',            'setting-spray',          'Locking mist that keeps makeup fresh for up to 16 hours.',  16.00,  70, face_id,  true, false, '{}'),
    ('Eyebrow Pencil',           'eyebrow-pencil',         'Micro-precision brow pencil for natural-looking arches.',    6.00, 120, eyes_id,  true, false, '{}'),
    ('Face Powder',              'face-powder',            'Finely milled setting powder for a matte, poreless finish.',20.00,  65, face_id,  true, false, '{}'),
    ('Foundation',               'foundation',             'Full-coverage liquid foundation with a 24-hour hold.',      22.00,  55, face_id,  true, true,  '{}'),
    ('Concealer',                'concealer',              'Creamy concealer that covers dark circles and blemishes.',   10.00,  90, face_id,  true, false, '{}'),
    ('2-in-1 Lipstick',          '2-in-1-lipstick',        'Dual-ended lip product: matte on one side, gloss on other.',16.00,  75, lips_id,  true, true,  '{}'),
    ('Matte Lipstick',           'matte-lipstick',         'Long-lasting matte lipstick in intense, rich pigments.',    12.00, 100, lips_id,  true, false, '{}'),
    ('Mascara',                  'mascara',                'Volumizing mascara that lifts and defines lashes.',         10.00,  85, eyes_id,  true, false, '{}'),
    ('Makeup Remover',           'makeup-remover',         'Gentle micellar makeup remover that cleanses without stripping.',12.00, 95, tools_id, true, false, '{}'),
    ('Eye Crease Concealer',     'eye-crease-concealer',   'Lightweight concealer formulated to prevent creasing.',      8.00,  70, eyes_id,  true, false, '{}'),
    ('Brush Set 18pcs',          'brush-set-18pcs',        'Complete 18-piece professional makeup brush collection.',   20.00,  40, tools_id, true, true,  '{}'),
    ('Brush Set 14pcs',          'brush-set-14pcs',        'Essential 14-piece brush set for everyday application.',    15.00,  50, tools_id, true, false, '{}'),
    ('Setting Powder',           'setting-powder',         'Ultra-fine translucent setting powder for a locked finish.',15.00,  60, face_id,  true, false, '{}')
  ON CONFLICT (slug) DO UPDATE
    SET price       = EXCLUDED.price,
        category_id = EXCLUDED.category_id,
        is_active   = EXCLUDED.is_active,
        name        = EXCLUDED.name;

  -- VARIANTS: Foundation (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 30, true
  FROM public.products p,
       (VALUES ('Porcelain'), ('Beige'), ('Sand'), ('Caramel'), ('Espresso')) AS v(name)
  WHERE p.slug = 'foundation'
  ON CONFLICT DO NOTHING;

  -- VARIANTS: Concealer (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 30, true
  FROM public.products p,
       (VALUES ('Fair'), ('Light'), ('Medium'), ('Tan'), ('Deep')) AS v(name)
  WHERE p.slug = 'concealer'
  ON CONFLICT DO NOTHING;

  -- VARIANTS: Matte Lipstick (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 40, true
  FROM public.products p,
       (VALUES ('Ruby Red'), ('Rosewood'), ('Nude Blush'), ('Berry'), ('Classic Red')) AS v(name)
  WHERE p.slug = 'matte-lipstick'
  ON CONFLICT DO NOTHING;

  -- VARIANTS: 2-in-1 Lipstick (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 35, true
  FROM public.products p,
       (VALUES ('Rose Gold'), ('Mauve'), ('Coral'), ('Plum')) AS v(name)
  WHERE p.slug = '2-in-1-lipstick'
  ON CONFLICT DO NOTHING;

  -- VARIANTS: Eyebrow Pencil (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 50, true
  FROM public.products p,
       (VALUES ('Blonde'), ('Brunette'), ('Dark Brown'), ('Black')) AS v(name)
  WHERE p.slug = 'eyebrow-pencil'
  ON CONFLICT DO NOTHING;

  -- VARIANTS: Contour Stick (shades)
  INSERT INTO public.variants (product_id, name, variant_type, price_override, stock_quantity, is_active)
  SELECT p.id, v.name, 'shade'::public.variant_type_enum, NULL, 35, true
  FROM public.products p,
       (VALUES ('Light'), ('Medium'), ('Deep')) AS v(name)
  WHERE p.slug = 'contour-stick'
  ON CONFLICT DO NOTHING;

END$$;

-- ─────────────────────────────────────────────────────────────
-- 5. VERIFY
-- ─────────────────────────────────────────────────────────────

SELECT 'Categories' AS entity, COUNT(*) AS count FROM public.categories WHERE is_active = true
UNION ALL
SELECT 'Products',  COUNT(*) FROM public.products WHERE is_active = true
UNION ALL
SELECT 'Variants',  COUNT(*) FROM public.variants WHERE is_active = true;
