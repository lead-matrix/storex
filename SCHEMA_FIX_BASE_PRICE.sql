-- ============================================================
--  LMXEngine · DINA COSMETIC · SCHEMA REPAIR
--  Ensures 'products' table has the 'base_price' column
-- ============================================================

DO $$ 
BEGIN
    -- 1. If 'price' exists, rename it to 'base_price'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
        ALTER TABLE public.products RENAME COLUMN price TO base_price;
    END IF;

    -- 2. If 'base_price' STILL doesn't exist (meaning neither 'price' nor 'base_price' were there), add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='base_price') THEN
        ALTER TABLE public.products ADD COLUMN base_price numeric(10,2) NOT NULL DEFAULT 0.00;
    END IF;

    -- 3. Ensure other critical columns exist for the luxury mockup
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
        ALTER TABLE public.products ADD COLUMN stock integer NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='slug') THEN
        ALTER TABLE public.products ADD COLUMN slug text UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
        ALTER TABLE public.products ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='images') THEN
        ALTER TABLE public.products ADD COLUMN images text[] DEFAULT '{}';
    END IF;

END $$;
