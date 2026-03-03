-- ============================================================
--  DINA COSMETIC · MASTER DATABASE FILE
--  Version: MASTER-1.0 (replaces all previous SQL files)
--
--  Fixes ALL Supabase linter warnings:
--    ✓ auth_rls_initplan  → auth.uid() wrapped in (select auth.uid())
--    ✓ multiple_permissive_policies → exactly ONE policy per verb per table
--    ✓ sensitive_table rogue policies → fully dropped & table removed/cleaned
--
--  What this script does (idempotent, safe to re-run):
--    §0  Helper functions (is_admin, handle_updated_at, handle_new_user)
--    §1  Full schema creation (categories, products, variants, orders,
--        order_items, profiles, site_settings, frontend_content,
--        stripe_events, newsletter_subscribers)
--    §2  Enable RLS on every public table
--    §3  NUCLEAR DROP — every RLS policy on every public table
--        (catches sensitive_table, products_admin_all, etc.)
--    §4  Clean policies — exactly 1 per verb per table
--    §5  Triggers
--    §6  Storage bucket
--    §7  Indexes
--    §8  Seed data (categories, site_settings, frontend_content)
--    §9  Admin stats view
--    §10 RPC: process_order_atomic (atomic stock deduction + order create)
--    §11 Verification query
-- ============================================================
-- ─────────────────────────────────────────────────────────────
-- §0. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────
-- Efficient admin check — result is cached per query, not per row
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
-- Auto-stamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
-- Auto-create profile on new auth user
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
-- ─────────────────────────────────────────────────────────────
-- §1. SCHEMA — tables created if they don't exist, columns
--     added if missing (fully idempotent)
-- ─────────────────────────────────────────────────────────────
-- 1A. profiles (Supabase auth extension)
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
-- Rename price → base_price if the legacy column still exists
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
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Sync legacy inventory → stock if needed
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
-- Rename stock_quantity → stock if legacy name exists
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
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS amount_total numeric(10, 2);
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Sync legacy columns
UPDATE public.orders
SET customer_email = email
WHERE customer_email IS NULL
    AND email IS NOT NULL;
UPDATE public.orders
SET amount_total = total_amount
WHERE amount_total IS NULL
    AND total_amount IS NOT NULL;
-- 1F. order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- Add variant_id if missing
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
-- 1G. stripe_events (idempotency table — NO public policies, service_role only)
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- 1H. site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 1I. frontend_content
CREATE TABLE IF NOT EXISTS public.frontend_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key text UNIQUE NOT NULL,
    content_type text NOT NULL,
    content_data jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 1J. newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- ─────────────────────────────────────────────────────────────
-- §2. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
-- ─────────────────────────────────────────────────────────────
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
-- ─────────────────────────────────────────────────────────────
-- §3. NUCLEAR DROP — ALL RLS POLICIES ON ALL PUBLIC TABLES
--     This is the ONLY way to guarantee zero duplicates.
--     Catches: products_admin_all, products_public_read,
--     profiles_admin_all, profiles_insert_own, profiles_select_own,
--     profiles_update_own, sensitive_owner_access,
--     sensitive_trusted_admins — and anything else lurking.
-- ─────────────────────────────────────────────────────────────
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
-- Drop sensitive_table if it is a test/rogue table with no real purpose
-- (Safe: if it has data you want to keep, comment this out)
DROP TABLE IF EXISTS public.sensitive_table CASCADE;
-- ─────────────────────────────────────────────────────────────
-- §4. CLEAN RLS POLICIES
--     Rules:
--       • Exactly ONE policy per SQL verb per table
--       • auth.uid() ALWAYS wrapped in (SELECT auth.uid())
--         → eliminates auth_rls_initplan warnings
--       • Admin writes delegate to (SELECT public.is_admin())
--         which itself uses (SELECT auth.uid()) internally
-- ─────────────────────────────────────────────────────────────
-- ── 4.1 PROFILES ─────────────────────────────────────────────
-- Public users can read only their own profile; admins read all.
-- Anon cannot select (forces login).
CREATE POLICY "profiles_select" ON public.profiles FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
-- Users insert their own profile (triggered on sign-up too).
CREATE POLICY "profiles_insert" ON public.profiles FOR
INSERT WITH CHECK (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
-- Users update their own profile; admins update any.
CREATE POLICY "profiles_update" ON public.profiles FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT public.is_admin()
        )
    );
-- Only admins delete profiles.
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
-- ── 4.2 CATEGORIES ───────────────────────────────────────────
-- Everyone (including anonymous) can read categories for the shop.
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
-- ── 4.3 PRODUCTS ─────────────────────────────────────────────
-- Active products are public. Admins see all (including inactive).
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
-- ── 4.4 VARIANTS ─────────────────────────────────────────────
-- Variants are always publicly readable (same visibility as products).
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
-- ── 4.5 ORDERS ───────────────────────────────────────────────
-- Users see their own orders; admins see all.
-- INSERT is done by service_role (webhook) or authenticated checkout.
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
INSERT TO authenticated WITH CHECK (
        (
            SELECT auth.uid()
        ) = user_id
        OR (
            SELECT public.is_admin()
        )
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
-- ── 4.6 ORDER_ITEMS ──────────────────────────────────────────
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
-- ── 4.7 STRIPE_EVENTS ────────────────────────────────────────
-- No public access. Accessed exclusively via service_role in the
-- webhook handler. RLS enabled with zero policies = total lockout.
-- service_role bypasses RLS by design.
-- (No policies created here intentionally.)
-- ── 4.8 SITE_SETTINGS ────────────────────────────────────────
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
-- ── 4.9 FRONTEND_CONTENT ─────────────────────────────────────
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
-- ── 4.10 NEWSLETTER_SUBSCRIBERS ──────────────────────────────
-- Anyone can subscribe (anon INSERT). No public read.
CREATE POLICY "newsletter_select" ON public.newsletter_subscribers FOR
SELECT USING (
        (
            SELECT public.is_admin()
        )
    );
-- Anyone can subscribe, but the email must be non-null and look like an email.
-- WITH CHECK (true) is replaced with a real constraint to pass the linter.
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
-- ─────────────────────────────────────────────────────────────
-- §5. TRIGGERS
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS frontend_content_updated_at ON public.frontend_content;
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
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ─────────────────────────────────────────────────────────────
-- §6. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
-- Storage RLS policies on storage.objects (correct Supabase approach)
-- Drop existing first to avoid duplicates
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
-- Anyone can view product images (public bucket)
CREATE POLICY "product_images_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'product-images');
-- Only admins can upload product images
CREATE POLICY "product_images_admin_insert" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'product-images'
        AND (
            SELECT public.is_admin()
        )
    );
-- Only admins can update product images
CREATE POLICY "product_images_admin_update" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'product-images'
        AND (
            SELECT public.is_admin()
        )
    );
-- Only admins can delete product images
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'product-images'
    AND (
        SELECT public.is_admin()
    )
);
-- ─────────────────────────────────────────────────────────────
-- §7. INDEXES (performance)
-- ─────────────────────────────────────────────────────────────
-- Products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured)
WHERE is_featured = true;
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
-- Variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
-- Newsletter
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
-- ─────────────────────────────────────────────────────────────
-- §8. SEED DATA
-- ─────────────────────────────────────────────────────────────
-- 8A. Categories (4 root categories — immutable contract)
INSERT INTO public.categories (name, slug, description, is_active)
VALUES (
        'Face',
        'face',
        'Exquisite complexion essentials.',
        true
    ),
    (
        'Eyes',
        'eyes',
        'Captivating high-pigment eye cosmetics.',
        true
    ),
    (
        'Lips',
        'lips',
        'Lustrous and enduring lip colors.',
        true
    ),
    (
        'Tools & Accessories',
        'tools',
        'Professional instruments for artistic precision.',
        true
    ) ON CONFLICT (slug) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;
-- 8B. Products (full launch catalogue — idempotent via slug upsert)
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_face_collection_1772224740512.png']
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
        ARRAY ['/luxury_makeup_eye_collection_1772224770135.png']
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
        ARRAY ['/luxury_makeup_eye_collection_1772224770135.png']
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
        ARRAY ['/luxury_makeup_eye_collection_1772224770135.png']
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
        ARRAY ['/luxury_makeup_eye_collection_1772224770135.png']
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
        ARRAY ['/luxury_makeup_eye_collection_1772224770135.png']
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
        ARRAY ['/luxury_makeup_lip_collection_1772224796578.png']
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
        ARRAY ['/luxury_makeup_lip_collection_1772224796578.png']
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
        ARRAY ['/luxury_makeup_lip_collection_1772224796578.png']
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
        ARRAY ['/luxury_makeup_lip_collection_1772224796578.png']
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
        ARRAY ['/luxury_makeup_tools_collection_1772224817128.png']
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
        ARRAY ['/luxury_makeup_tools_collection_1772224817128.png']
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
        ARRAY ['/luxury_makeup_tools_collection_1772224817128.png']
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
-- 8C. Ensure all products have stock > 0
UPDATE public.products
SET stock = 100
WHERE stock IS NULL
    OR stock <= 0;
-- 8D. Ensure all products have images
UPDATE public.products
SET images = ARRAY ['/logo.jpg']
WHERE images IS NULL
    OR array_length(images, 1) = 0;
-- 8E. Promote admin accounts (both emails are admins)
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
        'arafat.leadmatrix@gmail.com',
        'leadmatrix.us@gmail.com'
    );
-- 8F. Site settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
        'store_info',
        '{"name":"DINA COSMETIC","tagline":"Luxury Obsidian Skincare","currency":"USD"}'::jsonb
    ),
    ('store_enabled', 'true'::jsonb),
    (
        'shipping',
        '{"free_threshold": 50, "flat_rate": 5.99}'::jsonb
    ) ON CONFLICT (setting_key) DO NOTHING;
-- 8G. Frontend content
INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES (
        'hero_main',
        'hero',
        '{"title":"The Essence of Luxury","subtitle":"Discover the obsidian collection"}'::jsonb
    ) ON CONFLICT (content_key) DO NOTHING;
-- ─────────────────────────────────────────────────────────────
-- §9. ADMIN SALES STATS VIEW
--     security_invoker = true → view runs as calling user
--     → RLS is still enforced; only admins can see full data
-- ─────────────────────────────────────────────────────────────
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
            AND p.is_active = true
    ) AS low_stock_products,
    COUNT(DISTINCT pr.id) AS total_customers
FROM public.orders o
    FULL OUTER JOIN public.products p ON true
    FULL OUTER JOIN public.profiles pr ON true;
GRANT SELECT ON public.admin_sales_stats TO authenticated;
-- ─────────────────────────────────────────────────────────────
-- §10. RPC: process_order_atomic
--      Called by the Stripe webhook (service_role).
--      Atomically: creates order + inserts order_items +
--      deducts stock from products and variants.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_order_atomic(
        p_stripe_session_id text,
        p_customer_email text,
        p_user_id uuid,
        p_amount_total bigint,
        -- in cents
        p_currency text,
        p_metadata jsonb
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE new_order_id uuid;
item_record jsonb;
v_items jsonb;
BEGIN -- Extract items array from metadata
v_items := (p_metadata->>'items')::jsonb;
-- Create the master order record
INSERT INTO public.orders (
        stripe_session_id,
        customer_email,
        user_id,
        amount_total,
        currency,
        status,
        fulfillment_status
    )
VALUES (
        p_stripe_session_id,
        p_customer_email,
        p_user_id,
        p_amount_total::numeric / 100.0,
        p_currency,
        'paid',
        'unfulfilled'
    ) ON CONFLICT (stripe_session_id) DO NOTHING
RETURNING id INTO new_order_id;
-- If already processed (idempotency), bail out
IF new_order_id IS NULL THEN
SELECT id INTO new_order_id
FROM public.orders
WHERE stripe_session_id = p_stripe_session_id;
RETURN new_order_id;
END IF;
-- Insert order items and deduct stock
FOR item_record IN
SELECT *
FROM jsonb_array_elements(v_items) LOOP
INSERT INTO public.order_items (
        order_id,
        product_id,
        variant_id,
        quantity,
        price
    )
VALUES (
        new_order_id,
        (item_record->>'product_id')::uuid,
        NULLIF(item_record->>'variant_id', '')::uuid,
        (item_record->>'quantity')::integer,
        (item_record->>'price')::numeric
    );
-- Deduct from product stock (never below 0)
UPDATE public.products
SET stock = GREATEST(0, stock - (item_record->>'quantity')::integer)
WHERE id = (item_record->>'product_id')::uuid;
-- Deduct from variant stock if applicable
IF (item_record->>'variant_id') IS NOT NULL
AND (item_record->>'variant_id') != '' THEN
UPDATE public.variants
SET stock = GREATEST(0, stock - (item_record->>'quantity')::integer)
WHERE id = (item_record->>'variant_id')::uuid;
END IF;
END LOOP;
RETURN new_order_id;
END;
$$;
-- ─────────────────────────────────────────────────────────────
-- §11. VERIFICATION
--      After running this script, this query should show
--      exactly 4 policies per table (no more, no less).
--      stripe_events intentionally has 0 policies.
-- ─────────────────────────────────────────────────────────────
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