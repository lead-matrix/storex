-- ============================================================
--  LMXEngine · DINA COSMETIC · FINAL SCHEMA ALIGNMENT
--  Idempotent script to ensure all tables match the app logic.
--  Run this BEFORE any seed scripts.
-- ============================================================

-- 1. PROFILES ALIGNMENT
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. CATEGORIES (Ensures base table exists)
CREATE TABLE IF NOT EXISTS public.categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    slug        text UNIQUE NOT NULL,
    description text,
    is_active   boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- 3. PRODUCTS ALIGNMENT
DO $$ 
BEGIN
    -- Rename 'price' to 'base_price' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
        ALTER TABLE public.products RENAME COLUMN price TO base_price;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='base_price') THEN
        ALTER TABLE public.products ADD COLUMN base_price numeric(10,2) NOT NULL DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
        ALTER TABLE public.products ADD COLUMN stock integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
        ALTER TABLE public.products ADD COLUMN slug text UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
        ALTER TABLE public.products ADD COLUMN images text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
        ALTER TABLE public.products ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id);
    END IF;

END $$;

-- 4. VARIANTS ALIGNMENT
CREATE TABLE IF NOT EXISTS public.variants (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name           text NOT NULL,
    variant_type   text NOT NULL DEFAULT 'shade',
    price_override numeric(10,2),
    stock          integer NOT NULL DEFAULT 0,
    is_active      boolean DEFAULT true,
    color_code     text,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now()
);

-- 5. ORDERS ALIGNMENT
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_total numeric(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
