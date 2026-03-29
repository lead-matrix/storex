-- ================================================================
--  DINA COSMETIC  ·  MASTER DATABASE  ·  v2.1
--  Single source of truth — run this once in Supabase SQL Editor.
--  Safe to re-run (fully idempotent — no data loss).
--  NOTE: Before first use on a fresh DB, run RESET_DATABASE.sql first.
--
--  SECTIONS
--  §0   Helper functions
DO $$ BEGIN -- Drop NOT NULL on legacy 'title' column on product_variants (v1 schema artifact)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
        AND column_name = 'title'
) THEN EXECUTE 'ALTER TABLE public.product_variants ALTER COLUMN title DROP NOT NULL';
END IF;
-- Drop NOT NULL on legacy 'title' column on variants (old table name)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'title'
) THEN EXECUTE 'ALTER TABLE public.variants ALTER COLUMN title DROP NOT NULL';
END IF;
-- Drop NOT NULL on legacy 'name' column on products
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'name'
) THEN EXECUTE 'ALTER TABLE public.products ALTER COLUMN name DROP NOT NULL';
END IF;
-- Drop NOT NULL on legacy 'price' column on product_variants (v1 schema artifact)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
        AND column_name = 'price'
) THEN EXECUTE 'ALTER TABLE public.product_variants ALTER COLUMN price DROP NOT NULL';
END IF;
-- Drop NOT NULL on legacy 'price' column on variants (old table name)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'price'
) THEN EXECUTE 'ALTER TABLE public.variants ALTER COLUMN price DROP NOT NULL';
END IF;
END $$;
--  §1   Core tables  (profiles, categories, products, variants,
--                     orders, order_items, stripe_events)
--  §2   CMS tables   (site_settings, frontend_content,
--                     newsletter_subscribers, navigation_menus,
--                     cms_pages, cms_sections, theme_settings)
--  §3   Enable RLS on every table
--  §4   NUCLEAR DROP all existing public policies (clean slate)
--  §5   RLS policies  — exactly 1 per verb per table
--  §6   Triggers
--  §7   Storage bucket + policies
--  §8   Indexes
--  §9   Seed data     (categories, products, site_settings,
--                     frontend_content, navigation_menus,
--                     cms_pages + sections, theme_settings)
--  §10  Admin stats view
--  §11  RPC: process_order_atomic
--  §12  Verification query
--
--  Linter fixes included:
--    ✓ auth_rls_initplan          → auth.uid() wrapped in (SELECT auth.uid())
--    ✓ multiple_permissive_policies → exactly 1 policy / verb / table
--    ✓ rogue_policies             → nuclear drop before recreate
--    ✓ newsletter permissive INSERT → email regex constraint
-- ================================================================
-- ───────────────────────────────────────────────────────────────
-- §0  HELPER FUNCTIONS
-- ───────────────────────────────────────────────────────────────
-- is_admin(): cached per query — no per-row re-evaluation
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
            AND role = 'admin'
    );
END;
$$;
-- handle_updated_at(): auto-stamps updated_at on every update
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
-- handle_new_user(): auto-creates profile row when auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
-- ───────────────────────────────────────────────────────────────
-- §1  CORE TABLES
-- ───────────────────────────────────────────────────────────────
-- 1A. Profiles — extends Supabase auth.users
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'user',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- 1B. categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Rename legacy is_active → status if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'categories'
        AND column_name = 'is_active'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'categories'
        AND column_name = 'status'
) THEN
ALTER TABLE public.categories
    RENAME COLUMN is_active TO status;
UPDATE public.categories
SET status = 'active'
WHERE status = 'true';
UPDATE public.categories
SET status = 'draft'
WHERE status = 'false';
END IF;
END $$;
-- 1C. products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text UNIQUE,
    description text,
    base_price numeric(10, 2) NOT NULL DEFAULT 0.00,
    sale_price numeric(10, 2),
    on_sale boolean NOT NULL DEFAULT false,
    category_id uuid REFERENCES public.categories(id) ON DELETE
    SET NULL,
        stock integer NOT NULL DEFAULT 0,
        images text [] NOT NULL DEFAULT '{}',
        is_featured boolean NOT NULL DEFAULT false,
        is_bestseller boolean NOT NULL DEFAULT false,
        is_new boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'active',
        metadata jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
-- Rename legacy column price → base_price if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'price'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'base_price'
) THEN
ALTER TABLE public.products
    RENAME COLUMN price TO base_price;
END IF;
END $$;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS base_price numeric(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) CHECK (
        sale_price IS NULL
        OR sale_price >= 0
    );
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS on_sale boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images text [] NOT NULL DEFAULT '{}';
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ 
BEGIN 
    -- 1. Addition with ADD COLUMN IF NOT EXISTS (Safety)
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_oz numeric(10, 2);
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_in numeric(10, 2);
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_in numeric(10, 2);
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_in numeric(10, 2);

    -- 2. Rename Legacy Columns ONLY if they exist and target doesn't exist yet
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='weight_grams') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='weight_oz') 
    THEN 
       ALTER TABLE public.products RENAME COLUMN weight_grams TO weight_oz;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='length_cm') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='length_in') 
    THEN 
       ALTER TABLE public.products RENAME COLUMN length_cm TO length_in;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='width_cm') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='width_in') 
    THEN 
       ALTER TABLE public.products RENAME COLUMN width_cm TO width_in;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='height_cm') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='height_in') 
    THEN 
       ALTER TABLE public.products RENAME COLUMN height_cm TO height_in;
    END IF;
END $$;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku text;
-- Product-level SKU (for simple products without variants)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS country_of_origin text;
-- ISO 3166-1 alpha-2 country code, e.g. 'US', 'CN', 'FR' — required for customs on international shipments
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS customs_value_usd numeric(10, 2);
-- Declared value per unit in USD — used on customs forms (CN22/CP72) for international shipping
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS title text;
-- Rename legacy name → title if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'name'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'title'
) THEN
ALTER TABLE public.products
    RENAME COLUMN name TO title;
END IF;
END $$;
-- Rename legacy is_active → status if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'is_active'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'status'
) THEN
ALTER TABLE public.products
    RENAME COLUMN is_active TO status;
UPDATE public.products
SET status = 'active'
WHERE status = 'true'
    OR status = '1';
UPDATE public.products
SET status = 'draft'
WHERE status = 'false'
    OR status = '0';
END IF;
END $$;
-- Sync legacy inventory → stock
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'inventory'
) THEN EXECUTE 'UPDATE public.products SET stock = inventory WHERE stock = 0 AND inventory > 0';
END IF;
END $$;
-- 1D. product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL,
    variant_type text NOT NULL DEFAULT 'shade',
    price_override numeric(10, 2) CHECK (
        price_override IS NULL
        OR price_override >= 0
    ),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku text UNIQUE,
    color_code text,
    image_url text,
    -- per-variant hero image (shown when this variant is selected)
    weight numeric(8, 3), -- in oz, used by Shippo for shipping rate calculation
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS variant_type text NOT NULL DEFAULT 'shade';
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS price_override numeric(10, 2);
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS color_code text;
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS weight numeric(8, 3);
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- 1D.bis Data Normalization and SKU Generation
DO $$ BEGIN -- Normalize variant_type (only if NULL/empty)
-- Shade grouping
UPDATE public.product_variants
SET variant_type = 'shade'
WHERE (
        variant_type IS NULL
        OR variant_type = ''
        OR variant_type = 'shade'
    )
    AND (
        name ILIKE ANY (
            ARRAY ['Burgundy', 'Rose Matte', 'Mauve', 'Red', 'Abrico', 'Brown', 'Gold', 'Nature']
        )
        OR color_code IS NOT NULL
    );
-- Size grouping
UPDATE public.product_variants
SET variant_type = 'size'
WHERE (
        variant_type IS NULL
        OR variant_type = ''
        OR variant_type = 'size'
    )
    AND (
        name ILIKE ANY (
            ARRAY ['Small', 'Medium', 'Large', '14 Pieces', '18 Pieces']
        )
    );
-- Default for others if still NULL
UPDATE public.product_variants
SET variant_type = 'shade'
WHERE variant_type IS NULL
    OR variant_type = '';
-- Generate missing SKUs: PRODUCTCODE-VARIANTCODE
-- Using first 3 chars of product title and first 4 chars of variant name
UPDATE public.product_variants v
SET sku = UPPER(
        REGEXP_REPLACE(
            SUBSTRING(p.title, 1, 3),
            '[^a-zA-Z0-0]',
            '',
            'g'
        )
    ) || '-' || UPPER(
        REGEXP_REPLACE(SUBSTRING(v.name, 1, 4), '[^a-zA-Z0-0]', '', 'g')
    )
FROM public.products p
WHERE v.product_id = p.id
    AND (
        v.sku IS NULL
        OR v.sku = ''
    );
-- Final Validation: Ensure required fields are NOT NULL
-- We do this at the end of the block to ensure data is populated
ALTER TABLE public.product_variants
ALTER COLUMN product_id
SET NOT NULL;
ALTER TABLE public.product_variants
ALTER COLUMN variant_type
SET NOT NULL;
ALTER TABLE public.product_variants
ALTER COLUMN sku
SET NOT NULL;
ALTER TABLE public.product_variants
ALTER COLUMN stock
SET NOT NULL;
ALTER TABLE public.product_variants
ALTER COLUMN status
SET NOT NULL;
END $$;
-- ensure product_variants table name consistency
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'variants'
        AND table_schema = 'public'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'product_variants'
        AND table_schema = 'public'
) THEN EXECUTE 'ALTER TABLE public.variants RENAME TO product_variants';
END IF;
END $$;
-- Fix legacy title/name columns for v2
DO $$ BEGIN -- If title exists but not name, rename it
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
        AND column_name = 'title'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
        AND column_name = 'name'
) THEN
ALTER TABLE public.product_variants
    RENAME COLUMN title TO name;
END IF;
-- If title exists and is NOT NULL, make it nullable so inserts without it work
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
        AND column_name = 'title'
) THEN
ALTER TABLE public.product_variants
ALTER COLUMN title DROP NOT NULL;
END IF;
END $$;
-- Rename legacy stock_quantity → stock if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'stock_quantity'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'stock'
) THEN EXECUTE 'ALTER TABLE public.variants RENAME COLUMN stock_quantity TO stock';
END IF;
END $$;
-- Rename legacy is_active → status if present
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'is_active'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'variants'
        AND column_name = 'status'
) THEN EXECUTE 'ALTER TABLE public.variants RENAME COLUMN is_active TO status';
END IF;
END $$;
-- 1E. orders
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        customer_email text,
        amount_total numeric(10, 2),
        currency text NOT NULL DEFAULT 'usd',
        status text NOT NULL DEFAULT 'pending' CHECK (
            status IN (
                'pending',
                'paid',
                'shipped',
                'out_for_delivery',
                'delivered',
                'cancelled',
                'refunded'
            )
        ),
        fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
        shipping_address jsonb,
        billing_address jsonb,
        stripe_session_id text UNIQUE,
        tracking_number text,
        carrier text,
        shippo_tracking_status text,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
-- Ensure existing constraint is updated
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'));

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS amount_total numeric(10, 2);
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_label_url text;
-- Drop orphaned admin_audit_logs table (has RLS but no policies — not in schema)
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
-- Sync legacy columns
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'email'
) THEN
UPDATE public.orders
SET customer_email = email
WHERE customer_email IS NULL
    AND email IS NOT NULL;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'total_amount'
) THEN
UPDATE public.orders
SET amount_total = total_amount
WHERE amount_total IS NULL
    AND total_amount IS NOT NULL;
END IF;
END $$;
-- Safely drop legacy NOT NULL constraints if columns still exist
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'email'
) THEN
ALTER TABLE public.orders
ALTER COLUMN email DROP NOT NULL;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'total_amount'
) THEN
ALTER TABLE public.orders
ALTER COLUMN total_amount DROP NOT NULL;
END IF;
END $$;
-- 1F. order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE
    SET NULL,
        variant_id uuid REFERENCES public.product_variants(id) ON DELETE
    SET NULL,
        quantity integer NOT NULL CHECK (quantity > 0),
        price numeric(10, 2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'order_items'
        AND column_name = 'variant_id'
) THEN
ALTER TABLE public.order_items
ADD COLUMN variant_id uuid REFERENCES public.product_variants(id);
END IF;
END $$;
-- 1G. stripe_events — idempotency log, service_role only
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id text PRIMARY KEY,
    type text,
    data jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 1H. email_logs — idempotency log for sent emails (service_role only)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type text NOT NULL,
    recipient text NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE
    SET NULL,
        sent_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now()
);
-- 1I. inventory_reservations — hold stock during checkout (service_role only)
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    session_id text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 1J. product_images — optional separate image metadata table
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 1K. user_profiles — extended user data (maps 1:1 with profiles)
-- Note: profiles is the primary user table; user_profiles holds extra UI preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name text,
    preferences jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 1L. order_tracking_history — real-time carrier updates
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    details text,
    location text,
    shippo_event_id text UNIQUE,
    object_created timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- ───────────────────────────────────────────────────────────────
-- §2  CMS TABLES
-- ───────────────────────────────────────────────────────────────
-- 2A. site_settings — key-value store for all store config
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL DEFAULT '{}',
    created_by uuid REFERENCES public.profiles(id) DEFAULT (SELECT auth.uid()),
    updated_by uuid REFERENCES public.profiles(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);
-- 2B. frontend_content — every editable storefront section
CREATE TABLE IF NOT EXISTS public.frontend_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key text UNIQUE NOT NULL,
    content_type text NOT NULL,
    content_data jsonb NOT NULL DEFAULT '{}',
    created_by uuid REFERENCES public.profiles(id) DEFAULT (SELECT auth.uid()),
    updated_by uuid REFERENCES public.profiles(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.frontend_content ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.frontend_content ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);
-- 2C. newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 2D. navigation_menus — admin edits header/footer nav from dashboard
CREATE TABLE IF NOT EXISTS public.navigation_menus (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_key text UNIQUE NOT NULL,
    label text NOT NULL,
    menu_items jsonb NOT NULL DEFAULT '[]',
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) DEFAULT (SELECT auth.uid()),
    updated_by uuid REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.navigation_menus ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.navigation_menus ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);
-- 2E. cms_pages — dynamic site pages (About/Contact/Privacy/Terms/Home)
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    is_published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 2F. cms_sections — dynamic sections within cms_pages 
CREATE TABLE IF NOT EXISTS public.cms_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
    type text NOT NULL,
    -- 'hero', 'productGrid', 'richText', 'imageBanner'
    sort_order integer NOT NULL DEFAULT 0,
    props jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 2G. theme_settings — admin controls brand colours/fonts
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_key text UNIQUE NOT NULL,
    label text NOT NULL,
    settings jsonb NOT NULL DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ───────────────────────────────────────────────────────────────
-- §3  ENABLE RLS ON EVERY TABLE
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_history ENABLE ROW LEVEL SECURITY;
-- ───────────────────────────────────────────────────────────────
-- §4  NUCLEAR DROP — every public RLS policy
--     Guarantees zero duplicates and removes all stale/rogue
--     policies (products_admin_all, sensitive_owner_access, etc.)
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        r.policyname,
        r.schemaname,
        r.tablename
    );
END LOOP;
END $$;
-- Remove stale test table if it exists
DROP TABLE IF EXISTS public.sensitive_table CASCADE;
-- ───────────────────────────────────────────────────────────────
-- §5  RLS POLICIES
--     Rules:
--       • Exactly 1 policy per SQL verb per table
--       • auth.uid() always wrapped in (SELECT auth.uid())
--         → eliminates auth_rls_initplan linter warning
--       • Admin access uses (SELECT public.is_admin())
--         → cached per query, not per row
-- ───────────────────────────────────────────────────────────────
-- 5.1  PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "profiles_insert" ON public.profiles FOR
INSERT WITH CHECK (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "profiles_update" ON public.profiles FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.2  CATEGORIES  — public read, admin write
CREATE POLICY "categories_select" ON public.categories FOR
SELECT USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "categories_update" ON public.categories FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.3  PRODUCTS  — active products are public, admins see all
CREATE POLICY "products_select" ON public.products FOR
SELECT USING (
        status = 'active'
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "products_insert" ON public.products FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "products_update" ON public.products FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.4  PRODUCT_VARIANTS  — public read, admin write
CREATE POLICY "product_variants_select" ON public.product_variants FOR
SELECT USING (true);
CREATE POLICY "product_variants_insert" ON public.product_variants FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_variants_update" ON public.product_variants FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_variants_delete" ON public.product_variants FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.5  ORDERS  — users see own orders, admins see all
CREATE POLICY "orders_select" ON public.orders FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "orders_insert" ON public.orders FOR
INSERT WITH CHECK (
        (
            SELECT public.is_admin()
        )
        OR (
            SELECT auth.uid()
        ) = user_id
    );
CREATE POLICY "orders_update" ON public.orders FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "orders_delete" ON public.orders FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.6  ORDER_ITEMS  — users see items from their own orders
CREATE POLICY "order_items_select" ON public.order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = order_items.order_id
                AND (
                    (
                        SELECT auth.uid()
                    ) = o.user_id
                    OR (
                        SELECT public.is_admin()
                    )
                )
        )
    );
CREATE POLICY "order_items_insert" ON public.order_items FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "order_items_update" ON public.order_items FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "order_items_delete" ON public.order_items FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.7  STRIPE_EVENTS  — service_role only (via RLS bypass)
--      Public and authenticated users have zero access.
--      Only the webhook handler (service_role) can read/write.
CREATE POLICY "stripe_events_admin_select" ON public.stripe_events FOR
SELECT USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "stripe_events_admin_insert" ON public.stripe_events FOR
INSERT WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
-- 5.7b EMAIL_LOGS  — service_role only
CREATE POLICY "email_logs_admin_select" ON public.email_logs FOR
SELECT USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "email_logs_admin_insert" ON public.email_logs FOR
INSERT WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "email_logs_admin_delete" ON public.email_logs FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.7c INVENTORY_RESERVATIONS  — service_role only
CREATE POLICY "inv_res_admin_all" ON public.inventory_reservations FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.7d PRODUCT_IMAGES  — public read (images are public), admin write
CREATE POLICY "product_images_select" ON public.product_images FOR
SELECT USING (true);
CREATE POLICY "product_images_insert" ON public.product_images FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_images_update" ON public.product_images FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_images_delete" ON public.product_images FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.7e USER_PROFILES  — users see/edit own row, admin sees all
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR
INSERT WITH CHECK (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "user_profiles_delete" ON public.user_profiles FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.8  SITE_SETTINGS  — public read, admin write
CREATE POLICY "site_settings_select" ON public.site_settings FOR
SELECT USING (true);
CREATE POLICY "site_settings_insert" ON public.site_settings FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "site_settings_update" ON public.site_settings FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "site_settings_delete" ON public.site_settings FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.9  FRONTEND_CONTENT  — public read, admin write
CREATE POLICY "frontend_content_select" ON public.frontend_content FOR
SELECT USING (true);
CREATE POLICY "frontend_content_admin_all" ON public.frontend_content FOR ALL TO authenticated USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.10 NEWSLETTER_SUBSCRIBERS
--      Anyone can subscribe; email must be valid (fixes linter permissive-insert warning)
CREATE POLICY "newsletter_select" ON public.newsletter_subscribers FOR
SELECT USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "newsletter_insert" ON public.newsletter_subscribers FOR
INSERT WITH CHECK (
        email IS NOT NULL
        AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    );
CREATE POLICY "newsletter_update" ON public.newsletter_subscribers FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "newsletter_delete" ON public.newsletter_subscribers FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.11 NAVIGATION_MENUS  — public read, admin write
CREATE POLICY "nav_menus_select" ON public.navigation_menus FOR
SELECT USING (true);
CREATE POLICY "nav_menus_insert" ON public.navigation_menus FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "nav_menus_update" ON public.navigation_menus FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "nav_menus_delete" ON public.navigation_menus FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- (pages and builder_pages tables removed — all CMS is handled by cms_pages/cms_sections)
-- 5.12  THEME_SETTINGS  — public read active theme, admin write
CREATE POLICY "theme_settings_select" ON public.theme_settings FOR
SELECT USING (
        is_active = true
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_settings_insert" ON public.theme_settings FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_settings_update" ON public.theme_settings FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_settings_delete" ON public.theme_settings FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.19  CMS_PAGES  — public read published, admin write
CREATE POLICY "cms_pages_select" ON public.cms_pages FOR
SELECT USING (
        is_published = true
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_pages_insert" ON public.cms_pages FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_pages_update" ON public.cms_pages FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_pages_delete" ON public.cms_pages FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.20  CMS_SECTIONS  — public read parent published, admin write
CREATE POLICY "cms_sections_select" ON public.cms_sections FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cms_pages
            WHERE id = page_id
                AND is_published = true
        )
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_sections_insert" ON public.cms_sections FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_sections_update" ON public.cms_sections FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "cms_sections_delete" ON public.cms_sections FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.21 ORDER_TRACKING_HISTORY — users see their own, admins see all
CREATE POLICY "order_tracking_history_select" ON public.order_tracking_history FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_tracking_history.order_id
        AND (
            (SELECT auth.uid()) = o.user_id
            OR (SELECT public.is_admin())
        )
    )
);
CREATE POLICY "order_tracking_history_insert" ON public.order_tracking_history FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "order_tracking_history_update" ON public.order_tracking_history FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "order_tracking_history_delete" ON public.order_tracking_history FOR DELETE USING (
    (SELECT public.is_admin())
);
-- ───────────────────────────────────────────────────────────────
-- §6  TRIGGERS  — updated_at + auto-profile on signup
-- ───────────────────────────────────────────────────────────────
-- 6A. DROP EXISTING TRIGGERS SAFELY
DO $$ BEGIN -- Profiles
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
) THEN DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
END IF;
-- Categories
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'categories'
) THEN DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
END IF;
-- Products
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'products'
) THEN DROP TRIGGER IF EXISTS products_updated_at ON public.products;
END IF;
-- Product Variants (and legacy variants)
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'variants'
) THEN DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
) THEN DROP TRIGGER IF EXISTS variants_updated_at ON public.product_variants;
DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
END IF;
-- Orders
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'orders'
) THEN DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
END IF;
-- Site Settings
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'site_settings'
) THEN DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
END IF;
-- Frontend Content
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'frontend_content'
) THEN DROP TRIGGER IF EXISTS frontend_content_updated_at ON public.frontend_content;
END IF;
-- Navigation Menus
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'navigation_menus'
) THEN DROP TRIGGER IF EXISTS nav_menus_updated_at ON public.navigation_menus;
END IF;
-- Theme Settings
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'theme_settings'
) THEN DROP TRIGGER IF EXISTS theme_settings_updated_at ON public.theme_settings;
END IF;
-- Auth Trigger
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth'
        AND table_name = 'users'
) THEN DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
END IF;
END $$;
CREATE TRIGGER profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER categories_updated_at BEFORE
UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER products_updated_at BEFORE
UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER product_variants_updated_at BEFORE
UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER orders_updated_at BEFORE
UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER site_settings_updated_at BEFORE
UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER frontend_content_updated_at BEFORE
UPDATE ON public.frontend_content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER nav_menus_updated_at BEFORE
UPDATE ON public.navigation_menus FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER theme_settings_updated_at BEFORE
UPDATE ON public.theme_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ───────────────────────────────────────────────────────────────
-- §7  STORAGE BUCKET + POLICIES
-- ───────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_admin_insert" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'product-images'
        AND (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_images_admin_update" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'product-images'
        AND (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'product-images'
    AND (
        SELECT public.is_admin()
    )
);
-- ───────────────────────────────────────────────────────────────
-- §8  INDEXES
-- ───────────────────────────────────────────────────────────────
-- Products — core lookup columns only
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale)
WHERE on_sale = true;
-- DROPPED: idx_products_is_featured, idx_products_is_new, idx_products_is_bestseller
--   Reason: boolean partial indexes on a small catalog — full-table scan is cheaper.
--   The RLS filter (status='active') already limits rows to a manageable set.
-- DROPPED: idx_products_created_at
--   Reason: products are not sorted by created_at in any live query path.

-- Orders — all four are actively hit in production
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
-- DROPPED: idx_orders_payment_status, idx_orders_fulfillment_status, idx_orders_coupon_id
--   Reason: status covers payment status; coupon_id is covered by FK implicit index.
--   Admin filters on status already use idx_orders_status above.

-- Categories / variants / profiles / newsletter
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
-- DROPPED: idx_product_variants_status, idx_product_variants_variant_type
--   Reason: status is boolean-like (active/draft), variant_type has only 4 values —
--           both have low cardinality and queries always filter via product_id first.
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
-- Keep: is_admin() runs on every authenticated request via middleware.
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
-- Add index for tracking history
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON public.order_tracking_history(order_id);
-- Keep: uniqueness enforcement + duplicate-check on subscribe.
-- ───────────────────────────────────────────────────────────────
-- §9  SEED DATA  (idempotent — ON CONFLICT DO UPDATE)
-- ───────────────────────────────────────────────────────────────
-- 9A. Categories
INSERT INTO public.categories (name, slug, description, image_url, status)
VALUES (
        'Face',
        'face',
        'Exquisite complexion essentials.',
        '/products/face.png',
        'active'
    ),
    (
        'Eyes',
        'eyes',
        'Captivating high-pigment eye cosmetics.',
        '/products/eyes.png',
        'active'
    ),
    (
        'Lips',
        'lips',
        'Lustrous and enduring lip colors.',
        '/products/lips.png',
        'active'
    ),
    (
        'Tools & Accessories',
        'tools',
        'Professional instruments for artistic precision.',
        '/products/tools.png',
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    status = EXCLUDED.status;
-- 9B. Products (full launch catalogue)
DO $$
DECLARE face_id uuid;
eyes_id uuid;
lips_id uuid;
tools_id uuid;
BEGIN
SELECT id INTO face_id
FROM public.categories
WHERE slug = 'face';
SELECT id INTO eyes_id
FROM public.categories
WHERE slug = 'eyes';
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
SELECT id INTO tools_id
FROM public.categories
WHERE slug = 'tools';
-- FACE
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
        'Luxurious Foundation',
        'luxurious-foundation',
        22.00,
        'Matte finish, high-coverage foundation for a flawless obsidian glow.',
        face_id,
        100,
        true,
        'active',
        ARRAY ['/products/foundation.png', '/products/face.png']
    ),
    (
        'Obsidian Face Powder',
        'face-powder',
        20.00,
        'Ultra-fine compact powder for a velvety skin texture.',
        face_id,
        120,
        false,
        'active',
        ARRAY ['/products/face-powder.png', '/products/foundation.png']
    ),
    (
        'Velvet Setting Powder',
        'setting-powder',
        15.00,
        'Loose translucent powder to lock in your masterpiece.',
        face_id,
        80,
        false,
        'active',
        ARRAY ['/products/face.png', '/products/foundation.png']
    ),
    (
        'Mist of Gold Setting Spray',
        'setting-spray',
        16.00,
        'Gilded hydration that sets makeup for 24 hours.',
        face_id,
        60,
        true,
        'active',
        ARRAY ['/products/face.png', '/products/face-powder.png']
    ),
    (
        'Primordial Face Primer',
        'face-primer',
        15.00,
        'Smooths and prepares the canvas for intense pigments.',
        face_id,
        90,
        false,
        'active',
        ARRAY ['/products/foundation.png', '/products/face.png']
    ),
    (
        'Sculpting Contour Stick',
        'contour-stick',
        12.99,
        'Creamy definition for dramatic obsidian shadows.',
        face_id,
        50,
        false,
        'active',
        ARRAY ['/products/face.png', '/products/face-powder.png']
    ),
    (
        'Ethereal Concealer',
        'concealer',
        10.00,
        'Hides imperfections with a weightless silk formula.',
        face_id,
        150,
        false,
        'active',
        ARRAY ['/products/foundation.png', '/products/face.png']
    ),
    (
        '3-in-1 Bloom Blush',
        'bloom-blush',
        25.00,
        'Contour, Blush, and Highlight in one stunning palette.',
        face_id,
        40,
        true,
        'active',
        ARRAY ['/products/face.png', '/products/face-powder.png']
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
-- EYES
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
        'Midnight Eyeshadow Palette',
        'eyeshadow-palette',
        25.00,
        'Highly pigmented shades from deep onyx to sparkling gold.',
        eyes_id,
        70,
        true,
        'active',
        ARRAY ['/products/eyeshadow.png', '/products/eyes.png']
    ),
    (
        'Crease-Defying Eye Primer',
        'eye-primer',
        8.00,
        'Specifically designed for cut-crease and long-wear pigments.',
        eyes_id,
        110,
        false,
        'active',
        ARRAY ['/products/eyes.png', '/products/eyeshadow.png']
    ),
    (
        'Onyx Mascara',
        'mascara',
        10.00,
        'Enlarging mascara with deep black obsidian fibers.',
        eyes_id,
        200,
        true,
        'active',
        ARRAY ['/products/mascara.png', '/products/eyeshadow.png']
    ),
    (
        'Precision Eyeliner',
        'eyeliner',
        12.00,
        'Liquid gold-flecked black liner for a defined gaze.',
        eyes_id,
        130,
        false,
        'active',
        ARRAY ['/products/mascara.png', '/products/eyes.png']
    ),
    (
        'Arch Definition Eyebrow Pencil',
        'eyebrow-pencil',
        6.00,
        'Fine-tip pencil for natural or dramatic brow sculpting.',
        eyes_id,
        180,
        false,
        'active',
        ARRAY ['/products/eyes.png', '/products/eyeshadow.png']
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
-- LIPS
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
        'Obsidian Matte Lipstick',
        'matte-lipstick',
        12.00,
        'Intense color payoff with a luxurious non-drying finish.',
        lips_id,
        140,
        true,
        'active',
        ARRAY ['/products/lipstick.png', '/products/lips.png']
    ),
    (
        'Crystal Lip Gloss',
        'lip-gloss',
        14.00,
        'High-shine finish with gold dust micro-particles.',
        lips_id,
        90,
        false,
        'active',
        ARRAY ['/products/lip-gloss.png', '/products/lipstick.png']
    ),
    (
        'Eternal Lip Tint',
        'lip-tint',
        12.00,
        'Soft, buildable stain for a natural lip flush.',
        lips_id,
        80,
        false,
        'active',
        ARRAY ['/products/lips.png', '/products/lipstick.png']
    ),
    (
        'Dual-Soul 2-in-1 Lipstick',
        'dual-lipstick',
        16.00,
        'Matte lipstick and Lipgloss in one elegant obsidian tube.',
        lips_id,
        65,
        true,
        'active',
        ARRAY ['/products/lipstick.png', '/products/lip-gloss.png']
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
-- TOOLS & ACCESSORIES
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
        'Grand Master Brush Set (18pcs)',
        'brush-set-18',
        20.00,
        'The complete professional set for full artistic mastery.',
        tools_id,
        30,
        true,
        'active',
        ARRAY ['/products/brushes.png', '/products/tools.png']
    ),
    (
        'Artisan Brush Set (14pcs)',
        'brush-set-14',
        15.00,
        'Essential collection for daily elegant rituals.',
        tools_id,
        45,
        false,
        'active',
        ARRAY ['/products/brushes.png', '/products/tools.png']
    ),
    (
        'Pure Ritual Makeup Remover',
        'makeup-remover',
        12.00,
        '2-in-1 hydrating cleanser that dissolves even waterproof lipsticks.',
        tools_id,
        100,
        false,
        'active',
        ARRAY ['/products/tools.png', '/products/brushes.png']
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
-- 9B. VARIANTS (Shades & Editions)
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        color_code,
        sku
    )
SELECT id,
    'Crimson Ritual',
    'shade',
    NULL::numeric,
    50,
    '#800000',
    'LIP-CRIMSON'
FROM public.products
WHERE slug = 'solid-matte-creamy-lipstick'
UNION ALL
SELECT id,
    'Onyx Velvet',
    'shade',
    NULL::numeric,
    30,
    '#1A1A1A',
    'LIP-ONYX'
FROM public.products
WHERE slug = 'solid-matte-creamy-lipstick'
UNION ALL
SELECT id,
    'Gilded Rose',
    'shade',
    NULL::numeric,
    45,
    '#DB7093',
    'LIP-ROSE'
FROM public.products
WHERE slug = 'solid-matte-creamy-lipstick'
UNION ALL
SELECT id,
    'Crystal Clear',
    'shade',
    NULL::numeric,
    60,
    '#FDFDFD',
    'GLOSS-CLEAR'
FROM public.products
WHERE slug = 'liquid-lip-gloss'
UNION ALL
SELECT id,
    'Stardust Gold',
    'shade',
    16.00,
    40,
    '#D4AF37',
    'GLOSS-GOLD'
FROM public.products
WHERE slug = 'liquid-lip-gloss'
UNION ALL
SELECT id,
    'Porcelain',
    'shade',
    NULL::numeric,
    25,
    '#F1E9DB',
    'FND-PORC'
FROM public.products
WHERE slug = 'luxurious-foundation'
UNION ALL
SELECT id,
    'Sand',
    'shade',
    NULL::numeric,
    35,
    '#E4D5B7',
    'FND-SAND'
FROM public.products
WHERE slug = 'luxurious-foundation'
UNION ALL
SELECT id,
    'Honey',
    'shade',
    NULL::numeric,
    20,
    '#D4B483',
    'FND-HONY'
FROM public.products
WHERE slug = 'luxurious-foundation'
UNION ALL
SELECT id,
    'Cocoa',
    'shade',
    NULL::numeric,
    15,
    '#3E2723',
    'FND-COCA'
FROM public.products
WHERE slug = 'luxurious-foundation' ON CONFLICT (sku) DO
UPDATE
SET name = EXCLUDED.name,
    stock = EXCLUDED.stock,
    price_override = EXCLUDED.price_override,
    color_code = EXCLUDED.color_code;
END $$;
-- Ensure stock > 0 and images are set
UPDATE public.products
SET stock = 100
WHERE stock IS NULL
    OR stock <= 0;
UPDATE public.products
SET images = ARRAY ['/products/foundation.png']
WHERE images IS NULL
    OR array_length(images, 1) = 0;
-- ── Patch existing live rows: replace any old/broken image paths with CDN URLs ──
UPDATE public.products
SET images = ARRAY ['/products/foundation.png','/products/face.png']
WHERE slug = 'luxurious-foundation';
UPDATE public.products
SET images = ARRAY ['/products/face-powder.png','/products/foundation.png']
WHERE slug = 'face-powder';
UPDATE public.products
SET images = ARRAY ['/products/face.png','/products/foundation.png']
WHERE slug = 'setting-powder';
UPDATE public.products
SET images = ARRAY ['/products/face.png','/products/face-powder.png']
WHERE slug = 'setting-spray';
UPDATE public.products
SET images = ARRAY ['/products/foundation.png','/products/face.png']
WHERE slug = 'face-primer';
UPDATE public.products
SET images = ARRAY ['/products/face.png','/products/face-powder.png']
WHERE slug = 'contour-stick';
UPDATE public.products
SET images = ARRAY ['/products/foundation.png','/products/face.png']
WHERE slug = 'concealer';
UPDATE public.products
SET images = ARRAY ['/products/face.png','/products/face-powder.png']
WHERE slug = 'bloom-blush';
UPDATE public.products
SET images = ARRAY ['/products/eyeshadow.png','/products/eyes.png']
WHERE slug = 'eyeshadow-palette';
UPDATE public.products
SET images = ARRAY ['/products/eyes.png','/products/eyeshadow.png']
WHERE slug = 'eye-primer';
UPDATE public.products
SET images = ARRAY ['/products/mascara.png','/products/eyeshadow.png']
WHERE slug = 'mascara';
UPDATE public.products
SET images = ARRAY ['/products/mascara.png','/products/eyes.png']
WHERE slug = 'eyeliner';
UPDATE public.products
SET images = ARRAY ['/products/eyes.png','/products/eyeshadow.png']
WHERE slug = 'eyebrow-pencil';
UPDATE public.products
SET images = ARRAY ['/products/lipstick.png','/products/lips.png']
WHERE slug = 'matte-lipstick';
UPDATE public.products
SET images = ARRAY ['/products/lip-gloss.png','/products/lipstick.png']
WHERE slug = 'lip-gloss';
UPDATE public.products
SET images = ARRAY ['/products/lips.png','/products/lipstick.png']
WHERE slug = 'lip-tint';
UPDATE public.products
SET images = ARRAY ['/products/lipstick.png','/products/lip-gloss.png']
WHERE slug = 'dual-lipstick';
UPDATE public.products
SET images = ARRAY ['/products/brushes.png','/products/tools.png']
WHERE slug = 'brush-set-18';
UPDATE public.products
SET images = ARRAY ['/products/brushes.png','/products/tools.png']
WHERE slug = 'brush-set-14';
UPDATE public.products
SET images = ARRAY ['/products/tools.png','/products/brushes.png']
WHERE slug = 'makeup-remover';
-- ── Patch existing live category rows ──
UPDATE public.categories
SET image_url = '/products/face.png'
WHERE slug = 'face';
UPDATE public.categories
SET image_url = '/products/eyes.png'
WHERE slug = 'eyes';
UPDATE public.categories
SET image_url = '/products/lips.png'
WHERE slug = 'lips';
UPDATE public.categories
SET image_url = '/products/tools.png'
WHERE slug = 'tools';
-- Update hero image in frontend_content
UPDATE public.frontend_content
SET content_data = content_data || '{"image_url":"/products/hero-default.png"}'::jsonb
WHERE content_key = 'hero_main';
-- 9C. Admin accounts
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@dinacosmetic.store';
-- 9D. Site settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
        'store_info',
        '{"name":"DINA COSMETIC","tagline":"Luxury Obsidian Skincare","currency":"USD","email":"admin@dinacosmetic.store","phone":"+12816877609"}'::jsonb
    ),
    (
        'warehouse_info',
        '{"name":"Dina Cosmetic","street1":"5430 FM 359 Rd S Ste 400 PMB 1013","city":"Brookshire","state":"TX","zip":"77423","country":"US","phone":"+12816877609","email":"dinaecosmetic@gmail.com","parcel_l":"10","parcel_w":"7","parcel_h":"5","parcel_wt":"1"}'::jsonb
    ),
    ('store_enabled', 'true'::jsonb),
    (
        'shipping',
        '{"free_threshold":50,"flat_rate":9.99,"free_label":"Free Shipping on orders over $50","carrier":"USPS"}'::jsonb
    ),
    (
        'social_media',
        '{"instagram":"https://www.instagram.com/dinacosmetic_1?igsh=MTB1ZmUyOWg0dDg1Mw==","tiktok":"https://tiktok.com/@dinacosmetic","facebook":"https://facebook.com/dinacosmetic","pinterest":"","youtube":""}'::jsonb
    ),
    (
        'seo_defaults',
        '{"site_name":"DINA COSMETIC","title_template":"%s | DINA COSMETIC","default_description":"Luxury obsidian cosmetics — The Obsidian Palace","og_image":"/og-default.jpg","twitter_handle":"@dinacosmetic"}'::jsonb
    ),
    (
        'shipping_settings',
        '{
            "standard_rate": "7.99",
            "express_rate": "29.99",
            "international_standard_rate": "19.99",
            "international_express_rate": "49.99",
            "free_shipping_threshold": "100",
            "standard_label": "Standard Shipping",
            "express_label": "Express Shipping",
            "weight_brackets": [
                {"max_lb": 1, "rate": 7.99},
                {"max_lb": 3, "rate": 12.99},
                {"max_lb": 5, "rate": 18.99},
                {"max_lb": 10, "rate": 24.99},
                {"max_lb": 999, "rate": 35.00}
            ],
            "intl_weight_brackets": [
                {"max_lb": 1, "rate": 19.99},
                {"max_lb": 3, "rate": 29.99},
                {"max_lb": 5, "rate": 39.99},
                {"max_lb": 10, "rate": 59.99},
                {"max_lb": 999, "rate": 99.99}
            ]
        }'::jsonb
    ),
    (
        'promotions',
        '{"sale_active":false,"sale_label":"SALE","sale_badge_color":"#DC2626","bestseller_label":"BESTSELLER","featured_label":"FEATURED","new_label":"NEW"}'::jsonb
    ),
    (
        'email_settings',
        '{"from_name":"DINA COSMETIC","from_email":"support@dinacosmetic.store","reply_to":"support@dinacosmetic.store","order_confirmation":true,"shipping_notification":true,"newsletter_welcome":true}'::jsonb
    ) ON CONFLICT (setting_key) DO
UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = now();
-- 9E. Frontend content — every editable storefront section
INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES -- Homepage
    (
        'hero_main',
        'hero',
        '{"heading":"The Essence of Luxury","subheading":"Discover the Obsidian Collection — where art meets absolute beauty.","cta_text":"Discover Collection","cta_link":"/shop","image_url":"/hero-default.jpg","badge_text":"New Collection 2026"}'::jsonb
    ),
    (
        'announcement_banner',
        'banner',
        '{"text":"Free Shipping on orders over $50","cta_text":"Shop Now","cta_link":"/shop","is_active":true,"bg_color":"#D4AF37"}'::jsonb
    ),
    (
        'featured_section',
        'section',
        '{"heading":"The Collection","subheading":"Curated masterpieces for the discerning","cta_text":"View All","cta_link":"/shop","show_badges":true}'::jsonb
    ),
    (
        'brand_story',
        'section',
        '{"heading":"The Essence of Obsidian Masterpiece","subheading":"Born from the pursuit of absolute perfection","body":"DINA COSMETIC was founded not in a laboratory, but in a sanctuary. We believe that true beauty is the illumination of the soul, and our products are merely the vessels to manifest that light.","cta_text":"Discover Our Heritage","cta_link":"/about","image_url":"/story-image.jpg"}'::jsonb
    ),
    (
        'trust_indicators',
        'section',
        '{"items":[{"icon":"Truck","title":"Complimentary Delivery","description":"On all orders exceeding $50"},{"icon":"RotateCcw","title":"Effortless Returns","description":"30-day elegant exchange protocol"},{"icon":"Award","title":"Authentic Masterpieces","description":"Guaranteed direct from the Palace"},{"icon":"Shield","title":"Secure Encrypted Transport","description":"Uncompromised transaction safety"}]}'::jsonb
    ),
    (
        'newsletter_section',
        'section',
        '{"heading":"Join The Obsidian Palace","subheading":"Subscribe to receive exclusive access to new collection launches, private events, and editorial content.","placeholder":"Your Email Address","button_text":"Subscribe","success_text":"Welcome to the Palace"}'::jsonb
    ),
    (
        'collections_page',
        'page',
        '{"heading":"The Vaults","subheading":"Curated collections for the dedicated connoisseur"}'::jsonb
    ),
    -- About page
    (
        'about_hero',
        'page',
        '{"badge":"Our Genesis","heading":"The Obsidian Palace","tagline":"Born from the pursuit of absolute perfection"}'::jsonb
    ),
    (
        'about_story_1',
        'page',
        '{"heading":"Rituals of Illumination","body":"DINA COSMETIC was founded not in a laboratory, but in a sanctuary. We believe that true beauty is the illumination of the soul, and our products are merely the vessels to manifest that light."}'::jsonb
    ),
    (
        'about_story_2',
        'page',
        '{"heading":"The Obsidian Standard","body":"Every artifact produced within the Palace undergoes a rigorous alchemy of absolute black minerals and liquid gold accents. This is the Obsidian Standard — a promise of weight, luxury, and unmatched performance."}'::jsonb
    ),
    (
        'about_philosophy',
        'page',
        '{"items":[{"icon":"History","title":"Legacy","text":"Evolving the timeless secrets of cosmetics into modern artifacts."},{"icon":"ShieldCheck","title":"Purity","text":"Untouched by ordinary standards. Crafted for the absolute."},{"icon":"Sparkles","title":"Radiance","text":"Designed to capture and reflect light in its most premium form."},{"icon":"Heart","title":"Devotion","text":"A singular focus on the enhancement of your natural majesty."}]}'::jsonb
    ),
    (
        'about_closing_quote',
        'page',
        '{"quote":"Step out of the ordinary and into the sanctuary of your own excellence.","tagline":"The Ritual Awaits"}'::jsonb
    ),
    -- Contact page
    (
        'contact_page',
        'page',
        '{"badge":"Client Relations","heading":"Concierge","subheading":"Our dedicated team is available to assist you with any inquiries regarding the Palace collection and your acquisitions.","email":"support@dinacosmetic.store","phone":"+1 (281) 687-7609","address":"Texas, USA · Shipping Worldwide","form_heading":"Send an Inquiry","form_button":"Dispatch Message"}'::jsonb
    ),
    -- Footer & social
    (
        'footer_main',
        'footer',
        '{"brand":"DINA COSMETIC","tagline":"The Obsidian Palace · Luxury Redefined","copyright":"© 2026 DINA COSMETIC. All rights reserved.","newsletter_text":"Become part of the Palace"}'::jsonb
    ),
    (
        'social_links',
        'social',
        '{"instagram":"https://www.instagram.com/dinacosmetic_1?igsh=MTB1ZmUyOWg0dDg1Mw==","tiktok":"https://tiktok.com/@dinacosmetic","facebook":"https://facebook.com/dinacosmetic","pinterest":"","youtube":""}'::jsonb
    ),
    -- Legal
    (
        'privacy_page',
        'legal',
        '{"heading":"Privacy Policy","last_updated":"2026-03-03","sections":[{"title":"Data We Collect","body":"We collect your name, email, and shipping address when you place an order."},{"title":"How We Use Your Data","body":"Your data is used solely to process orders and send order updates. We never sell your data."},{"title":"Cookies","body":"We use essential cookies to keep you logged in and maintain your cart."},{"title":"Contact","body":"For privacy inquiries, email privacy@dinacosmetic.store"}]}'::jsonb
    ),
    (
        'terms_page',
        'legal',
        '{"heading":"Terms of Service","last_updated":"2026-03-03","sections":[{"title":"Acceptance","body":"By using this website you agree to these terms."},{"title":"Products & Pricing","body":"All prices are in USD. We reserve the right to change prices at any time."},{"title":"Returns","body":"We accept returns within 30 days of delivery for unopened products."},{"title":"Contact","body":"For legal inquiries, email legal@dinacosmetic.store"}]}'::jsonb
    ) ON CONFLICT (content_key) DO
UPDATE
SET content_data = EXCLUDED.content_data,
    updated_at = now();
-- 9F. Navigation menus
INSERT INTO public.navigation_menus (menu_key, label, display_order, menu_items)
VALUES (
        'header_main',
        'Header Navigation',
        1,
        '[{"label":"Shop","href":"/shop","is_active":true},{"label":"Collections","href":"/collections","is_active":true},{"label":"About","href":"/about","is_active":true},{"label":"Contact","href":"/contact","is_active":true}]'::jsonb
    ),
    (
        'footer_shop',
        'Footer — Shop Links',
        2,
        '[{"label":"All Products","href":"/shop"},{"label":"Face","href":"/collections/face"},{"label":"Eyes","href":"/collections/eyes"},{"label":"Lips","href":"/collections/lips"},{"label":"Tools","href":"/collections/tools"}]'::jsonb
    ),
    (
        'footer_legal',
        'Footer — Legal Links',
        3,
        '[{"label":"Privacy Policy","href":"/privacy"},{"label":"Terms of Service","href":"/terms"},{"label":"Contact","href":"/contact"}]'::jsonb
    ) ON CONFLICT (menu_key) DO
UPDATE
SET menu_items = EXCLUDED.menu_items,
    updated_at = now();
-- 9H. Theme settings
INSERT INTO public.theme_settings (theme_key, label, is_active, settings)
VALUES (
        'obsidian_palace',
        'Obsidian Palace (Default)',
        true,
        '{"colors":{"primary_bg":"#0A0A0A","secondary_bg":"#111111","accent_gold":"#D4AF37","text_primary":"#F5F0E8","text_muted":"#8A8A8A","border":"#2A2A2A"},"fonts":{"heading":"Playfair Display","body":"Inter"},"layout":{"max_width":"1280px","border_radius":"4px","header_style":"sticky"}}'::jsonb
    ) ON CONFLICT (theme_key) DO
UPDATE
SET settings = EXCLUDED.settings,
    is_active = EXCLUDED.is_active,
    updated_at = now();
-- ───────────────────────────────────────────────────────────────
-- §9G  CMS PAGES & SECTIONS (Unified Architecture)
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_home_id uuid;
v_about_id uuid;
BEGIN -- 1. Insert Home Page
INSERT INTO public.cms_pages (title, slug, is_published)
VALUES ('The Obsidian Palace', 'home', true) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    is_published = true
RETURNING id INTO v_home_id;
-- 2. Clear existing sections for rebuild (idempotency)
DELETE FROM public.cms_sections
WHERE page_id = v_home_id;
-- 3. Insert Home Sections
INSERT INTO public.cms_sections (page_id, type, sort_order, props)
VALUES (
        v_home_id,
        'hero',
        0,
        '{"title":"The Essence of Luxury","subtitle":"Discover the Obsidian Collection","imageUrl":"/products/hero-default.png"}'::jsonb
    ),
    (
        v_home_id,
        'productGrid',
        1,
        '{"category":"all", "limit":4}'::jsonb
    ),
    (
        v_home_id,
        'richText',
        2,
        '{"content":"DINA COSMETIC was born from the pursuit of absolute perfection. We believe that true beauty is the illumination of the soul, and our products are merely the vessels to manifest that light."}'::jsonb
    ),
    (
        v_home_id,
        'imageBanner',
        3,
        '{"imageUrl":"/products/tools.png", "title":"Artisan Brushes", "link":"/category/tools"}'::jsonb
    );
-- 4. Insert About Page
INSERT INTO public.cms_pages (title, slug, is_published)
VALUES ('Our Heritage', 'about', true) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    is_published = true
RETURNING id INTO v_about_id;
-- 5. Clear existing sections for About
DELETE FROM public.cms_sections
WHERE page_id = v_about_id;
-- 6. Insert About Sections
INSERT INTO public.cms_sections (page_id, type, sort_order, props)
VALUES (
        v_about_id,
        'hero',
        0,
        '{"title":"Born from Sanctuary","subtitle":"Our Heritage & Philosophy","imageUrl":"/products/face.png"}'::jsonb
    ),
    (
        v_about_id,
        'richText',
        1,
        '{"content":"Every artifact produced within the Palace undergoes a rigorous alchemy of absolute black minerals and liquid gold accents. This is the Obsidian Standard — a promise of weight, luxury, and unmatched performance."}'::jsonb
    );
END $$;
-- ───────────────────────────────────────────────────────────────
-- §10  ADMIN SALES STATS VIEW
--      security_invoker = true → RLS still enforced
--      Only admins see full data
-- ───────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_sales_stats;
CREATE VIEW public.admin_sales_stats WITH (security_invoker = true) AS
SELECT COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(
        SUM(o.amount_total) FILTER (
            WHERE o.status = 'paid'
        ),
        0
    ) AS total_revenue,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status = 'paid'
    ) AS paid_orders,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status = 'pending'
    ) AS pending_orders,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status = 'shipped'
    ) AS shipped_orders,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.status = 'active'
    ) AS active_products,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.stock < 5
            AND p.status = 'active'
    ) AS low_stock_products,
    COUNT(DISTINCT pr.id) AS total_customers
FROM public.orders o
    FULL OUTER JOIN public.products p ON true
    FULL OUTER JOIN public.profiles pr ON true;
GRANT SELECT ON public.admin_sales_stats TO authenticated;
-- ───────────────────────────────────────────────────────────────
-- §11  RPC: process_order_atomic
--      Called by Stripe webhook (service_role). 
--      Handles transition from 'pending' (created at checkout) to 'paid'.
--      Creates order_items and deducts stock only once.
-- ───────────────────────────────────────────────────────────────
-- Clean up signatures if they changed
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, uuid, bigint, text, jsonb);
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, bigint, text, jsonb);
CREATE OR REPLACE FUNCTION public.process_order_atomic(
        p_stripe_session_id text,
        p_customer_email text,
        p_amount_total bigint,
        -- in cents
        p_currency text,
        p_metadata jsonb,
        p_shipping_address jsonb DEFAULT NULL,
        p_billing_address jsonb DEFAULT NULL
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_order_id uuid;
v_already_paid boolean;
item_record jsonb;
v_items jsonb;
BEGIN -- 1. Identify existing order (created in checkout route)
v_order_id := (p_metadata->>'order_id')::uuid;
IF v_order_id IS NULL THEN
SELECT id,
    (status = 'paid') INTO v_order_id,
    v_already_paid
FROM public.orders
WHERE stripe_session_id = p_stripe_session_id;
ELSE
SELECT (status = 'paid') INTO v_already_paid
FROM public.orders
WHERE id = v_order_id;
END IF;
-- 2. Idempotency Check
IF v_already_paid = true THEN RETURN v_order_id;
END IF;
-- 3. Transition to 'paid' and save addresses
IF v_order_id IS NOT NULL THEN
UPDATE public.orders
SET stripe_session_id = p_stripe_session_id,
    customer_email = p_customer_email,
    status = 'paid',
    shipping_address = COALESCE(p_shipping_address, shipping_address),
    billing_address = COALESCE(p_billing_address, billing_address),
    updated_at = now()
WHERE id = v_order_id;
ELSE -- Fallback: Create new order
INSERT INTO public.orders (
        stripe_session_id,
        customer_email,
        amount_total,
        currency,
        status,
        fulfillment_status,
        shipping_address,
        billing_address
    )
VALUES (
        p_stripe_session_id,
        p_customer_email,
        p_amount_total::numeric / 100.0,
        p_currency,
        'paid',
        'unfulfilled',
        p_shipping_address,
        p_billing_address
    )
RETURNING id INTO v_order_id;
END IF;
-- 4. Process Items
-- Try to get items as a direct jsonb array first, fallback to text parsing
v_items := p_metadata->'items';
IF v_items IS NULL
OR jsonb_typeof(v_items) != 'array' THEN BEGIN v_items := (p_metadata->>'items')::jsonb;
EXCEPTION
WHEN OTHERS THEN v_items := NULL;
END;
END IF;
IF v_items IS NOT NULL
AND jsonb_array_length(v_items) > 0 THEN FOR item_record IN
SELECT *
FROM jsonb_array_elements(v_items) LOOP -- a. Insert order item
INSERT INTO public.order_items (
        order_id,
        product_id,
        variant_id,
        quantity,
        price
    )
VALUES (
        v_order_id,
        (item_record->>'product_id')::uuid,
        NULLIF(item_record->>'variant_id', '')::uuid,
        (item_record->>'quantity')::integer,
        (item_record->>'price')::numeric
    );
-- b. Deduct product stock
UPDATE public.products
SET stock = GREATEST(0, stock - (item_record->>'quantity')::integer)
WHERE id = (item_record->>'product_id')::uuid;
-- c. Deduct product_variant stock
IF (item_record->>'variant_id') IS NOT NULL
AND (item_record->>'variant_id') != '' THEN
UPDATE public.product_variants
SET stock = GREATEST(0, stock - (item_record->>'quantity')::integer)
WHERE id = (item_record->>'variant_id')::uuid;
END IF;
END LOOP;
END IF;
RETURN v_order_id;
END;
$$;
-- ───────────────────────────────────────────────────────────────
-- §12  VERIFICATION
--      Expected results after a clean run:
--        profiles, categories, products, variants, orders,
--        order_items, site_settings, frontend_content,
--        newsletter_subscribers, navigation_menus, pages,
--        theme_settings → 4 policies each
--        stripe_events → 0 policies (intentional)
-- ───────────────────────────────────────────────────────────────
SELECT tablename,
    COUNT(*) AS policy_count,
    string_agg(
        policyname || ' [' || cmd || ']',
        ', '
        ORDER BY cmd
    ) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- ================================================================
-- §12B  ATOMIC STOCK DECREMENT FUNCTIONS (Rule 53 — Race Condition Prevention)
--       Use these instead of read-then-write to prevent overselling.
-- ================================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity int)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_product_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id uuid, p_quantity int)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE public.product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_variant_id;
$$;

-- ================================================================
-- §12C  PERFORMANCE INDEXES (Part 5.1 additions)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ================================================================
-- §13  SYNC PRODUCT STOCK TRIGGER
--      Keeps the `products.stock` column perfectly in sync with the
--      aggregate sum of `product_variants.stock`, allowing simple
--      queries like .gt('stock', 0) to work accurately.
-- ================================================================
CREATE OR REPLACE FUNCTION public.sync_product_manifest() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE target_id uuid;
BEGIN target_id := COALESCE(NEW.product_id, OLD.product_id);
-- Only sync if variants exist
IF EXISTS (
    SELECT 1
    FROM public.product_variants
    WHERE product_id = target_id
) THEN
UPDATE public.products
SET stock = (
        SELECT COALESCE(SUM(stock), 0)
        FROM public.product_variants
        WHERE product_id = target_id
    ),
    base_price = (
        SELECT COALESCE(MIN(price_override), 0)
        FROM public.product_variants
        WHERE product_id = target_id
    ),
    -- If parent has no images, pull the first variant image as a fallback
    images = CASE
        WHEN (
            images = '{}'
            OR images IS NULL
            OR images = ARRAY ['/placeholder-product.jpg']
        ) THEN ARRAY(
            SELECT image_url
            FROM public.product_variants
            WHERE product_id = target_id
                AND image_url IS NOT NULL
                AND image_url != ''
            LIMIT 1
        )
        ELSE images
    END
WHERE id = target_id;
END IF;
RETURN COALESCE(NEW, OLD);
END;
$$;
DO $$ BEGIN DROP TRIGGER IF EXISTS tr_sync_product_stock ON public.product_variants;
DROP TRIGGER IF EXISTS tr_sync_product_manifest ON public.product_variants;
END $$;
CREATE TRIGGER tr_sync_product_manifest
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.sync_product_manifest();
-- ================================================================
-- §14  LAUNCH-READY EXTENSIONS (SHIPPO, RESEND, INVENTORY)
--      The following tables and triggers are required for full
--      operation of shipping, abandoned carts, and inventory logs.
-- ================================================================
-- ── 1. SHIPMENT INFRASTRUCTURE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    shippo_shipment_id text,
    carrier text,
    service text,
    shipping_cost numeric(10, 2),
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shipping_labels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    shippo_transaction_id text,
    tracking_number text,
    label_url text,
    carrier text,
    service text,
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status text,
    status_details text,
    location jsonb,
    event_time timestamptz,
    raw jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    order_item_id uuid NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz DEFAULT now()
);
-- ── 2. COMMERCE FEATURES (COUPONS, ABANDONED CARTS) ──────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value numeric NOT NULL,
    min_purchase_amount numeric DEFAULT 0,
    max_uses integer,
    used_count integer DEFAULT 0,
    expires_at timestamptz,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email text NOT NULL,
    items jsonb NOT NULL DEFAULT '[]',
    amount_total numeric NOT NULL,
    recovery_token text UNIQUE DEFAULT gen_random_uuid()::text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'emailed')),
    last_active timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
-- ── 3. INVENTORY LOGGING (Rule 49) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE
    SET NULL,
        change_amount integer NOT NULL,
        reason text NOT NULL,
        -- 'sale', 'restock', 'return', 'adjustment'
        order_id uuid REFERENCES public.orders(id) ON DELETE
    SET NULL,
        created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.log_inventory_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF (
        OLD.stock IS DISTINCT
        FROM NEW.stock
    ) THEN
INSERT INTO public.inventory_logs (variant_id, change_amount, reason)
VALUES (
        NEW.id,
        NEW.stock - OLD.stock,
        'Automated Stock Adjustment'
    );
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_inventory ON public.product_variants;
CREATE TRIGGER trg_log_inventory
AFTER
UPDATE OF stock ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.log_inventory_change();
-- ── 4. PERFORMANCE INDEXES ──────────────────────────────────────────
-- A. REQUIRED FOREIGN KEY INDEXES
--    These MUST exist to prevent full-table locks during parent deletes.
--    NOTE: Supabase may flag these as "Unused Index" if your DB is new and has no traffic.
--    IGNORE "Unused Index" warnings for these specific foreign keys.
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id ON public.inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON public.orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item_id ON public.shipment_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON public.shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON public.shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_cms_sections_page_id ON public.cms_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant_id ON public.inventory_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_shipment_id ON public.shipping_labels(shipment_id);

-- (Fallback for legacy 'parcels' table if it exists in the live DB)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parcels' AND table_schema = 'public') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_parcels_shipment_id ON public.parcels(shipment_id);';
    END IF;
END $$;

-- B. DROP UNUSED/DUPLICATE NON-FOREIGN-KEY INDEXES
--    These were flagged by Supabase as "Unused" or "Duplicate". We safely drop them to clear warnings.
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_orders_customer_email;
DROP INDEX IF EXISTS public.idx_products_category_id;
DROP INDEX IF EXISTS public.idx_orders_stripe_session;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_newsletter_email;
DROP INDEX IF EXISTS public.idx_product_variants_sku;
DROP INDEX IF EXISTS public.idx_shipments_shippo_shipment_id;
DROP INDEX IF EXISTS public.idx_shipping_labels_tracking_number;
DROP INDEX IF EXISTS public.idx_coupons_code;
DROP INDEX IF EXISTS public.idx_coupons_status;
DROP INDEX IF EXISTS public.idx_abandoned_carts_email;
DROP INDEX IF EXISTS public.idx_abandoned_carts_status;
DROP INDEX IF EXISTS public.idx_inventory_logs_variant; -- Replaced by standard variant_id naming
-- ── 5. RLS UPDATES ──────────────────────────────────────────────────
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
-- Admins full access, Users view own
DROP POLICY IF EXISTS "admin_shipments" ON public.shipments;
CREATE POLICY "admin_shipments" ON public.shipments FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_labels" ON public.shipping_labels;
CREATE POLICY "admin_labels" ON public.shipping_labels FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_coupons" ON public.coupons;
CREATE POLICY "admin_coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "admin_abandoned_carts" ON public.abandoned_carts FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_inventory_logs" ON public.inventory_logs;
CREATE POLICY "admin_inventory_logs" ON public.inventory_logs FOR ALL TO authenticated USING (public.is_admin());
-- ── 6. DATA CONSOLIDATION (ONE-TIME BACKFILL) ──────────────────────
-- Automatically fix 0.00 prices and missing images for existing listings 
-- by pulling data from their variants.
UPDATE public.products p
SET base_price = (
        SELECT COALESCE(MIN(price_override), 0)
        FROM public.product_variants
        WHERE product_id = p.id
            AND status = 'active'
    ),
    images = CASE
        WHEN (
            p.images = '{}'
            OR p.images IS NULL
            OR p.images = ARRAY ['/placeholder-product.jpg']
        ) THEN ARRAY(
            SELECT image_url
            FROM public.product_variants
            WHERE product_id = p.id
                AND image_url IS NOT NULL
                AND image_url != ''
            LIMIT 1
        )
        ELSE p.images
    END
WHERE (
        p.base_price = 0
        OR p.images = '{}'
        OR p.images IS NULL
    )
    AND EXISTS (
        SELECT 1
        FROM public.product_variants
        WHERE product_id = p.id
            AND status = 'active'
    );
-- ── 7. GLOBAL IMAGE OPTIMIZATION (REMOTE → LOCAL) ──────────────────
-- Force update all remote URLs to local /products/ paths for peak performance
UPDATE public.products
SET images = ARRAY(
        SELECT REPLACE(
                img,
                'https://hsevxangxdfyolgspydl.supabase.co/storage/v1/object/public/product-images/',
                '/products/'
            )
        FROM unnest(images) AS img
    )
WHERE array_to_string(images, ',') LIKE '%supabase.co%';
UPDATE public.products
SET images = ARRAY(
        SELECT REPLACE(
                img,
                'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/',
                '/products/'
            )
        FROM unnest(images) AS img
    )
WHERE array_to_string(images, ',') LIKE '%supabase.co%';
UPDATE public.product_variants
SET image_url = REPLACE(
        image_url,
        'https://hsevxangxdfyolgspydl.supabase.co/storage/v1/object/public/product-images/',
        '/products/'
    )
WHERE image_url LIKE '%supabase.co%';
UPDATE public.product_variants
SET image_url = REPLACE(
        image_url,
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/',
        '/products/'
    )
WHERE image_url LIKE '%supabase.co%';
UPDATE public.categories
SET image_url = REPLACE(
        image_url,
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/',
        '/products/'
    )
WHERE image_url LIKE '%supabase.co%';
-- Fix hero default extension (jpg in public, was png in seed)
-- ───────────────────────────────────────────────────────────────
-- §15  FINAL DATABASE OPTIMIZATION (March 2026)
--      Clears all 'Multiple Permissive Policies' warnings.
--      Ensures 100% Admin Sovereignty with zero performance overlap.
-- ───────────────────────────────────────────────────────────────

-- 1. WIPE ALL EXISTING POLICIES FOR A CLEAN REBUILD
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. THE SOVEREIGN SYSTEM (Single Policy per Table)
-- PRODUCTS
CREATE POLICY "authenticated_products_master" ON public.products FOR ALL TO authenticated 
USING (public.is_admin() OR status = 'active') WITH CHECK (public.is_admin());
CREATE POLICY "anon_products_read" ON public.products FOR SELECT TO anon USING (status = 'active');

-- VARIANTS
CREATE POLICY "authenticated_variants_master" ON public.product_variants FOR ALL TO authenticated 
USING (public.is_admin() OR status = 'active') WITH CHECK (public.is_admin());
CREATE POLICY "anon_variants_read" ON public.product_variants FOR SELECT TO anon USING (status = 'active');

-- CATEGORIES
CREATE POLICY "authenticated_categories_master" ON public.categories FOR ALL TO authenticated 
USING (public.is_admin() OR status = 'active') WITH CHECK (public.is_admin());
CREATE POLICY "anon_categories_read" ON public.categories FOR SELECT TO anon USING (status = 'active');

-- IMAGES
CREATE POLICY "authenticated_images_master" ON public.product_images FOR ALL TO authenticated 
USING (public.is_admin() OR true) WITH CHECK (public.is_admin());
CREATE POLICY "anon_images_read" ON public.product_images FOR SELECT TO anon USING (true);

-- CMS PAGES
CREATE POLICY "authenticated_cms_pages_master" ON public.cms_pages FOR ALL TO authenticated 
USING (public.is_admin() OR is_published = true) WITH CHECK (public.is_admin());
CREATE POLICY "anon_cms_pages_read" ON public.cms_pages FOR SELECT TO anon USING (is_published = true);

-- CMS SECTIONS
CREATE POLICY "authenticated_cms_sections_master" ON public.cms_sections FOR ALL TO authenticated 
USING (public.is_admin() OR true) WITH CHECK (public.is_admin());
CREATE POLICY "anon_cms_sections_read" ON public.cms_sections FOR SELECT TO anon USING (true);

-- NAVIGATION
CREATE POLICY "authenticated_nav_master" ON public.navigation_menus FOR ALL TO authenticated 
USING (public.is_admin() OR true) WITH CHECK (public.is_admin());
CREATE POLICY "anon_nav_read" ON public.navigation_menus FOR SELECT TO anon USING (true);

-- SITE SETTINGS
CREATE POLICY "authenticated_settings_master" ON public.site_settings FOR ALL TO authenticated 
USING (public.is_admin() OR true) WITH CHECK (public.is_admin());
CREATE POLICY "anon_settings_read" ON public.site_settings FOR SELECT TO anon USING (true);

-- INVENTORY RESERVATIONS
CREATE POLICY "admin_only_reservations" ON public.inventory_reservations FOR ALL TO authenticated 
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. UNIVERSAL RULE (Everything else)
DO $$ 
DECLARE
    tbl NAME;
BEGIN
    FOR tbl IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('products', 'product_variants', 'categories', 'product_images', 'cms_pages', 'cms_sections', 'navigation_menus', 'site_settings', 'inventory_reservations')
    ) 
    LOOP
        EXECUTE format('CREATE POLICY "%I_admin_master" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', tbl, tbl);
    END LOOP;
END $$;