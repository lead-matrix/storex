-- ============================================================
--  LMXEngine · DINA COSMETIC · DEFINITIVE DB ALIGNMENT (V4)
--  Locked Schema Contract per USER REQUEST
-- ============================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    slug        text UNIQUE NOT NULL,
    description text,
    is_active   boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- 2. PRODUCTS TABLE
-- If 'price' exists, rename to 'base_price'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
        ALTER TABLE public.products RENAME COLUMN price TO base_price;
    END IF;
    -- Ensure stock exists (user requested 'stock', existing might be 'inventory')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
        ALTER TABLE public.products ADD COLUMN stock integer NOT NULL DEFAULT 0;
    END IF;
END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- 3. VARIANTS TABLE
-- User requested 'stock', existing might be 'stock_quantity'
CREATE TABLE IF NOT EXISTS public.variants (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name           text NOT NULL,
    variant_type   text NOT NULL DEFAULT 'shade', -- shade, size, etc.
    price_override numeric(10,2),
    stock          integer NOT NULL DEFAULT 0,
    is_active      boolean DEFAULT true,
    color_code     text, -- For swatches
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now()
);

-- Rename stock_quantity to stock if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='variants' AND column_name='stock_quantity') THEN
        ALTER TABLE public.variants RENAME COLUMN stock_quantity TO stock;
    END IF;
END $$;

-- 4. ROOT DATA SEED
INSERT INTO public.categories (name, slug, description, is_active)
VALUES 
  ('Face', 'face', 'Exquisite complexion essentials.', true),
  ('Eyes', 'eyes', 'Captivating pigments.', true),
  ('Lips', 'lips', 'Lustrous colors.', true),
  ('Tools & Accessories', 'tools', 'Professional instruments.', true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);
