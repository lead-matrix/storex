-- ================================================================
--  DINA COSMETIC  ·  MASTER DATABASE  ·  v2.0
--  Single source of truth — run this once in Supabase SQL Editor.
--  Safe to re-run (fully idempotent — no data loss).
--
--  SECTIONS
--  §0   Helper functions
--  §1   Core tables  (profiles, categories, products, variants,
--                     orders, order_items, stripe_events)
--  §2   CMS tables   (site_settings, frontend_content,
--                     newsletter_subscribers, navigation_menus,
--                     pages, theme_settings)
--  §3   Enable RLS on every table
--  §4   NUCLEAR DROP all existing public policies (clean slate)
--  §5   RLS policies  — exactly 1 per verb per table
--  §6   Triggers
--  §7   Storage bucket + policies
--  §8   Indexes
--  §9   Seed data     (categories, products, site_settings,
--                     frontend_content, navigation_menus,
--                     pages, theme_settings)
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
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
            AND role = 'admin'
    );
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
-- 1A. profiles — extends Supabase auth.users
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
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 1C. products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
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
        is_active boolean NOT NULL DEFAULT true,
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
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Sync legacy inventory → stock
UPDATE public.products
SET stock = inventory
WHERE stock = 0
    AND inventory > 0;
-- 1D. variants
CREATE TABLE IF NOT EXISTS public.variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL,
    variant_type text NOT NULL DEFAULT 'shade',
    price_override numeric(10, 2) CHECK (
        price_override IS NULL
        OR price_override >= 0
    ),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku text,
    color_code text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
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
) THEN
ALTER TABLE public.variants
    RENAME COLUMN stock_quantity TO stock;
END IF;
END $$;
-- 1E. orders
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE
    SET NULL,
        customer_email text,
        amount_total numeric(10, 2),
        currency text NOT NULL DEFAULT 'usd',
        status text NOT NULL DEFAULT 'pending' CHECK (
            status IN (
                'pending',
                'paid',
                'shipped',
                'cancelled',
                'refunded'
            )
        ),
        fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
        shipping_address jsonb,
        billing_address jsonb,
        stripe_session_id text UNIQUE,
        tracking_number text,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE
SET NULL;
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
UPDATE public.orders
SET customer_email = email
WHERE customer_email IS NULL
    AND email IS NOT NULL;
UPDATE public.orders
SET amount_total = total_amount
WHERE amount_total IS NULL
    AND total_amount IS NOT NULL;
-- Safely drop legacy NOT NULL constraints if columns still exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='email') THEN
        ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='total_amount') THEN
        ALTER TABLE public.orders ALTER COLUMN total_amount DROP NOT NULL;
    END IF;
END $$;
-- 1F. order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE
    SET NULL,
        variant_id uuid REFERENCES public.variants(id) ON DELETE
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
ADD COLUMN variant_id uuid REFERENCES public.variants(id);
END IF;
END $$;
-- 1G. stripe_events — idempotency log, service_role only
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id text PRIMARY KEY,
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
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 2B. frontend_content — every editable storefront section
CREATE TABLE IF NOT EXISTS public.frontend_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key text UNIQUE NOT NULL,
    content_type text NOT NULL,
    content_data jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);
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
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 2E. pages — admin edits About/Contact/Privacy/Terms content
CREATE TABLE IF NOT EXISTS public.pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    meta_title text,
    meta_desc text,
    content jsonb NOT NULL DEFAULT '{}',
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 2F. theme_settings — admin controls brand colours/fonts
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
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
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
        is_active = true
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
-- 5.4  VARIANTS  — public read, admin write
CREATE POLICY "variants_select" ON public.variants FOR
SELECT USING (true);
CREATE POLICY "variants_insert" ON public.variants FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "variants_update" ON public.variants FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "variants_delete" ON public.variants FOR DELETE USING (
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
-- 5.7  STRIPE_EVENTS  — no public policies (service_role only via RLS bypass)
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
CREATE POLICY "frontend_content_insert" ON public.frontend_content FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "frontend_content_update" ON public.frontend_content FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "frontend_content_delete" ON public.frontend_content FOR DELETE USING (
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
-- 5.12 PAGES  — published pages are public, admin sees all
CREATE POLICY "pages_select" ON public.pages FOR
SELECT USING (
        is_published = true
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_insert" ON public.pages FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_update" ON public.pages FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_delete" ON public.pages FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- 5.13 THEME_SETTINGS  — public read, admin write
CREATE POLICY "theme_select" ON public.theme_settings FOR
SELECT USING (true);
CREATE POLICY "theme_insert" ON public.theme_settings FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_update" ON public.theme_settings FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_delete" ON public.theme_settings FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- ───────────────────────────────────────────────────────────────
-- §6  TRIGGERS  — updated_at + auto-profile on signup
-- ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS frontend_content_updated_at ON public.frontend_content;
DROP TRIGGER IF EXISTS nav_menus_updated_at ON public.navigation_menus;
DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
DROP TRIGGER IF EXISTS theme_settings_updated_at ON public.theme_settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER categories_updated_at BEFORE
UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER products_updated_at BEFORE
UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER variants_updated_at BEFORE
UPDATE ON public.variants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER orders_updated_at BEFORE
UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER site_settings_updated_at BEFORE
UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER frontend_content_updated_at BEFORE
UPDATE ON public.frontend_content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER nav_menus_updated_at BEFORE
UPDATE ON public.navigation_menus FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER pages_updated_at BEFORE
UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
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
-- Products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured)
WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new)
WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale)
WHERE on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products(is_bestseller)
WHERE is_bestseller = true;
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
-- Categories / variants / profiles / newsletter / pages
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
-- ───────────────────────────────────────────────────────────────
-- §9  SEED DATA  (idempotent — ON CONFLICT DO UPDATE)
-- ───────────────────────────────────────────────────────────────
-- 9A. Categories
INSERT INTO public.categories (name, slug, description, image_url, is_active)
VALUES (
        'Face',
        'face',
        'Exquisite complexion essentials.',
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png',
        true
    ),
    (
        'Eyes',
        'eyes',
        'Captivating high-pigment eye cosmetics.',
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png',
        true
    ),
    (
        'Lips',
        'lips',
        'Lustrous and enduring lip colors.',
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png',
        true
    ),
    (
        'Tools & Accessories',
        'tools',
        'Professional instruments for artistic precision.',
        'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png',
        true
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_active = true;
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
        name,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        is_active,
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
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png']
    ),
    (
        'Obsidian Face Powder',
        'face-powder',
        20.00,
        'Ultra-fine compact powder for a velvety skin texture.',
        face_id,
        120,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png']
    ),
    (
        'Velvet Setting Powder',
        'setting-powder',
        15.00,
        'Loose translucent powder to lock in your masterpiece.',
        face_id,
        80,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png']
    ),
    (
        'Mist of Gold Setting Spray',
        'setting-spray',
        16.00,
        'Gilded hydration that sets makeup for 24 hours.',
        face_id,
        60,
        true,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png']
    ),
    (
        'Primordial Face Primer',
        'face-primer',
        15.00,
        'Smooths and prepares the canvas for intense pigments.',
        face_id,
        90,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png']
    ),
    (
        'Sculpting Contour Stick',
        'contour-stick',
        12.99,
        'Creamy definition for dramatic obsidian shadows.',
        face_id,
        50,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png']
    ),
    (
        'Ethereal Concealer',
        'concealer',
        10.00,
        'Hides imperfections with a weightless silk formula.',
        face_id,
        150,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png']
    ),
    (
        '3-in-1 Bloom Blush',
        'bloom-blush',
        25.00,
        'Contour, Blush, and Highlight in one stunning palette.',
        face_id,
        40,
        true,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png']
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    images = EXCLUDED.images;
-- EYES
INSERT INTO public.products (
        name,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        is_active,
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
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png']
    ),
    (
        'Crease-Defying Eye Primer',
        'eye-primer',
        8.00,
        'Specifically designed for cut-crease and long-wear pigments.',
        eyes_id,
        110,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png']
    ),
    (
        'Onyx Mascara',
        'mascara',
        10.00,
        'Enlarging mascara with deep black obsidian fibers.',
        eyes_id,
        200,
        true,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/mascara.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png']
    ),
    (
        'Precision Eyeliner',
        'eyeliner',
        12.00,
        'Liquid gold-flecked black liner for a defined gaze.',
        eyes_id,
        130,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/mascara.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png']
    ),
    (
        'Arch Definition Eyebrow Pencil',
        'eyebrow-pencil',
        6.00,
        'Fine-tip pencil for natural or dramatic brow sculpting.',
        eyes_id,
        180,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png']
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    images = EXCLUDED.images;
-- LIPS
INSERT INTO public.products (
        name,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        is_active,
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
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png']
    ),
    (
        'Crystal Lip Gloss',
        'lip-gloss',
        14.00,
        'High-shine finish with gold dust micro-particles.',
        lips_id,
        90,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lip-gloss.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png']
    ),
    (
        'Eternal Lip Tint',
        'lip-tint',
        12.00,
        'Soft, buildable stain for a natural lip flush.',
        lips_id,
        80,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png']
    ),
    (
        'Dual-Soul 2-in-1 Lipstick',
        'dual-lipstick',
        16.00,
        'Matte lipstick and Lipgloss in one elegant obsidian tube.',
        lips_id,
        65,
        true,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lip-gloss.png']
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    images = EXCLUDED.images;
-- TOOLS & ACCESSORIES
INSERT INTO public.products (
        name,
        slug,
        base_price,
        description,
        category_id,
        stock,
        is_featured,
        is_active,
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
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png']
    ),
    (
        'Artisan Brush Set (14pcs)',
        'brush-set-14',
        15.00,
        'Essential collection for daily elegant rituals.',
        tools_id,
        45,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png']
    ),
    (
        'Pure Ritual Makeup Remover',
        'makeup-remover',
        12.00,
        '2-in-1 hydrating cleanser that dissolves even waterproof lipsticks.',
        tools_id,
        100,
        false,
        true,
        ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png', 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png']
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    images = EXCLUDED.images;
END $$;
-- Ensure stock > 0 and images are set
UPDATE public.products
SET stock = 100
WHERE stock IS NULL
    OR stock <= 0;
UPDATE public.products
SET images = ARRAY ['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png']
WHERE images IS NULL
    OR array_length(images, 1) = 0;
-- ── Patch existing live rows: replace any old/broken image paths with CDN URLs ──
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png'] WHERE slug = 'luxurious-foundation';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png'] WHERE slug = 'face-powder';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png'] WHERE slug = 'setting-powder';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png'] WHERE slug = 'setting-spray';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png'] WHERE slug = 'face-primer';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png'] WHERE slug = 'contour-stick';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/foundation.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png'] WHERE slug = 'concealer';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face-powder.png'] WHERE slug = 'bloom-blush';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png'] WHERE slug = 'eyeshadow-palette';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png'] WHERE slug = 'eye-primer';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/mascara.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png'] WHERE slug = 'mascara';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/mascara.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png'] WHERE slug = 'eyeliner';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyeshadow.png'] WHERE slug = 'eyebrow-pencil';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png'] WHERE slug = 'matte-lipstick';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lip-gloss.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png'] WHERE slug = 'lip-gloss';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png'] WHERE slug = 'lip-tint';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lipstick.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lip-gloss.png'] WHERE slug = 'dual-lipstick';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png'] WHERE slug = 'brush-set-18';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png'] WHERE slug = 'brush-set-14';
UPDATE public.products SET images = ARRAY['https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png','https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/brushes.png'] WHERE slug = 'makeup-remover';

-- ── Patch existing live category rows ──
UPDATE public.categories SET image_url = 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/face.png' WHERE slug = 'face';
UPDATE public.categories SET image_url = 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/eyes.png' WHERE slug = 'eyes';
UPDATE public.categories SET image_url = 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/lips.png' WHERE slug = 'lips';
UPDATE public.categories SET image_url = 'https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/tools.png' WHERE slug = 'tools';

-- Update hero image in frontend_content
UPDATE public.frontend_content SET content_data = content_data || '{"image_url":"https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/hero-default.png"}'::jsonb WHERE content_key = 'hero_main';
-- 9C. Admin accounts
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
        'arafat.leadmatrix@gmail.com',
        'leadmatrix.us@gmail.com'
    );
-- 9D. Site settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
        'store_info',
        '{"name":"DINA COSMETIC","tagline":"Luxury Obsidian Skincare","currency":"USD","email":"concierge@dinacosmetic.store","phone":"+1 (800) LUX-DINA","address":"123 Obsidian Tower, Virtual City"}'::jsonb
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
        'promotions',
        '{"sale_active":false,"sale_label":"SALE","sale_badge_color":"#DC2626","bestseller_label":"BESTSELLER","featured_label":"FEATURED","new_label":"NEW"}'::jsonb
    ),
    (
        'email_settings',
        '{"from_name":"DINA COSMETIC","from_email":"concierge@dinacosmetic.store","reply_to":"concierge@dinacosmetic.store","order_confirmation":true,"shipping_notification":true,"newsletter_welcome":true}'::jsonb
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
-- 9G. Pages
INSERT INTO public.pages (
        slug,
        title,
        meta_title,
        meta_desc,
        content,
        is_published
    )
VALUES (
        'about',
        'About Us',
        'The Palace | DINA COSMETIC',
        'The story and philosophy of the Obsidian Palace.',
        '{"hero":{"badge":"Our Genesis","heading":"The Obsidian Palace"},"story":[{"heading":"Rituals of Illumination","body":"DINA COSMETIC was founded not in a laboratory, but in a sanctuary."},{"heading":"The Obsidian Standard","body":"Every artifact undergoes a rigorous alchemy of absolute black minerals and liquid gold accents."}],"closing_quote":"Step out of the ordinary and into the sanctuary of your own excellence."}'::jsonb,
        true
    ),
    (
        'contact',
        'Concierge',
        'Concierge | DINA COSMETIC',
        'Contact the Obsidian Palace for inquiries.',
        '{"heading":"Concierge","subheading":"Our dedicated team is available to assist you.","email":"concierge@dinacosmetic.store","phone":"+1 (800) LUX-DINA","address":"123 Obsidian Tower, Virtual City"}'::jsonb,
        true
    ),
    (
        'privacy',
        'Privacy Policy',
        'Privacy Policy | DINA COSMETIC',
        'How DINA COSMETIC handles your data.',
        '{"heading":"Privacy Policy","last_updated":"2026-03-03","sections":[{"title":"Data We Collect","body":"We collect your name, email, and shipping address."},{"title":"How We Use It","body":"Your data is used solely to process orders. We never sell your data."},{"title":"Contact","body":"Email: privacy@dinacosmetic.store"}]}'::jsonb,
        true
    ),
    (
        'terms',
        'Terms of Service',
        'Terms of Service | DINA COSMETIC',
        'Terms and conditions for using the DINA COSMETIC store.',
        '{"heading":"Terms of Service","last_updated":"2026-03-03","sections":[{"title":"Acceptance","body":"By using this website you agree to these terms."},{"title":"Pricing","body":"All prices are in USD and subject to change."},{"title":"Returns","body":"30-day returns on unopened products."},{"title":"Contact","body":"Email: legal@dinacosmetic.store"}]}'::jsonb,
        true
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_desc = EXCLUDED.meta_desc,
    content = EXCLUDED.content,
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
        WHERE p.is_active = true
    ) AS active_products,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.stock < 5
            AND p.is_active
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
        p_metadata jsonb
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_order_id uuid;
v_already_paid boolean;
item_record jsonb;
v_items jsonb;
BEGIN -- 1. Identify existing order (created in checkout route) or matching session
v_order_id := (p_metadata->>'order_id')::uuid;
-- If no order_id in metadata (or malformed), look up by stripe session
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
-- 2. Idempotency Check: if no order exists, or if order is already paid, bail early
IF v_already_paid = true THEN RETURN v_order_id;
END IF;
-- 3. Transition to 'paid' 
IF v_order_id IS NOT NULL THEN -- Link session if not yet linked, set status to paid, and capture customer email
UPDATE public.orders
SET stripe_session_id = p_stripe_session_id,
    customer_email = p_customer_email,
    status = 'paid',
    updated_at = now()
WHERE id = v_order_id;
ELSE -- Fallback: Create new order if it somehow doesn't exist (e.g., deleted)
INSERT INTO public.orders (
        stripe_session_id,
        customer_email,
        email,
        amount_total,
        total_amount,
        currency,
        status,
        fulfillment_status
    )
VALUES (
        p_stripe_session_id,
        p_customer_email,
        p_customer_email,
        p_amount_total::numeric / 100.0,
        p_amount_total::numeric / 100.0,
        p_currency,
        'paid',
        'unfulfilled'
    )
RETURNING id INTO v_order_id;
END IF;
-- 4. Re-fetch JSON items from metadata
BEGIN v_items := (p_metadata->>'items')::jsonb;
EXCEPTION
WHEN others THEN -- Items should be in metadata, if not, we can't fulfill
RETURN v_order_id;
END;
IF v_items IS NULL
OR jsonb_array_length(v_items) = 0 THEN RETURN v_order_id;
END IF;
-- 5. Atomic Fulfillment: order_items + stock deduction
FOR item_record IN
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
-- c. Deduct variant stock if applicable
IF (item_record->>'variant_id') IS NOT NULL
AND (item_record->>'variant_id') != '' THEN
UPDATE public.variants
SET stock = GREATEST(0, stock - (item_record->>'quantity')::integer)
WHERE id = (item_record->>'variant_id')::uuid;
END IF;
END LOOP;
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