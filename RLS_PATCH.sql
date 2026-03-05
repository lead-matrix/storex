-- ================================================================
--  DINA COSMETIC  ·  RLS PATCH  ·  v2.1
--  Run this in Supabase SQL Editor to fix all RLS policy issues.
--  Safe to re-run (idempotent).
--
--  Fixes:
--  1. Creates missing tables: email_logs, inventory_reservations,
--     product_images, user_profiles
--  2. Enables RLS on all new tables
--  3. Drops ALL existing policies (clean slate)
--  4. Recreates correct policies for EVERY table
-- ================================================================

-- ── STEP 1: Create missing tables (safe IF NOT EXISTS) ──────────

-- email_logs — idempotency log for sent emails (admin only)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type text NOT NULL,
    recipient text NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_reservations — hold stock during checkout (admin/service only)
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    session_id text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- product_images — image metadata table (public read, admin write)
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- user_profiles — extended user preferences (1:1 with profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name text,
    preferences jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add type/data columns to stripe_events if missing
ALTER TABLE public.stripe_events ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.stripe_events ADD COLUMN IF NOT EXISTS data jsonb;

-- ── STEP 2: Enable RLS on all tables ────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- ── STEP 3: NUCLEAR DROP — every public RLS policy ───────────────
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname,
            r.schemaname,
            r.tablename
        );
    END LOOP;
END $$;

-- ── STEP 4: Recreate all RLS policies ───────────────────────────

-- ── profiles ─────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── categories ───────────────────────────────────────────────────
-- Public can read; only admins can write
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── products ─────────────────────────────────────────────────────
-- Active products are public; admins see all
CREATE POLICY "products_select" ON public.products FOR SELECT USING (
    is_active = true OR (SELECT public.is_admin())
);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── variants ─────────────────────────────────────────────────────
CREATE POLICY "variants_select" ON public.variants FOR SELECT USING (true);
CREATE POLICY "variants_insert" ON public.variants FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "variants_update" ON public.variants FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "variants_delete" ON public.variants FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── orders ───────────────────────────────────────────────────────
-- Users see own orders; admins see all
-- INSERT is open (needed for checkout webhook via service_role)
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR (SELECT public.is_admin())
);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (
    (SELECT public.is_admin()) OR (SELECT auth.uid()) = user_id
);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "orders_delete" ON public.orders FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── order_items ──────────────────────────────────────────────────
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (
            (SELECT auth.uid()) = o.user_id
            OR (SELECT public.is_admin())
        )
    )
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "order_items_delete" ON public.order_items FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── stripe_events ─────────────────────────────────────────────────
-- Only admins can see (service_role bypasses RLS entirely)
CREATE POLICY "stripe_events_select" ON public.stripe_events FOR SELECT USING (
    (SELECT public.is_admin())
);
CREATE POLICY "stripe_events_insert" ON public.stripe_events FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);

-- ── email_logs ───────────────────────────────────────────────────
CREATE POLICY "email_logs_select" ON public.email_logs FOR SELECT USING (
    (SELECT public.is_admin())
);
CREATE POLICY "email_logs_insert" ON public.email_logs FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "email_logs_delete" ON public.email_logs FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── inventory_reservations ───────────────────────────────────────
CREATE POLICY "inv_res_all" ON public.inventory_reservations FOR ALL USING (
    (SELECT public.is_admin())
);

-- ── product_images ───────────────────────────────────────────────
-- Images are public (the files are in a public storage bucket anyway)
CREATE POLICY "product_images_select" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert" ON public.product_images FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "product_images_update" ON public.product_images FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "product_images_delete" ON public.product_images FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── user_profiles ─────────────────────────────────────────────────
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT USING (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE USING (
    (SELECT auth.uid()) = id OR (SELECT public.is_admin())
);
CREATE POLICY "user_profiles_delete" ON public.user_profiles FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── site_settings ─────────────────────────────────────────────────
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_insert" ON public.site_settings FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "site_settings_update" ON public.site_settings FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "site_settings_delete" ON public.site_settings FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── frontend_content ──────────────────────────────────────────────
CREATE POLICY "frontend_content_select" ON public.frontend_content FOR SELECT USING (true);
CREATE POLICY "frontend_content_insert" ON public.frontend_content FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "frontend_content_update" ON public.frontend_content FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "frontend_content_delete" ON public.frontend_content FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── newsletter_subscribers ────────────────────────────────────────
-- Anyone can subscribe (valid email required); only admins can manage
CREATE POLICY "newsletter_select" ON public.newsletter_subscribers FOR SELECT USING (
    (SELECT public.is_admin())
);
CREATE POLICY "newsletter_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
);
CREATE POLICY "newsletter_update" ON public.newsletter_subscribers FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "newsletter_delete" ON public.newsletter_subscribers FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── navigation_menus ──────────────────────────────────────────────
CREATE POLICY "nav_menus_select" ON public.navigation_menus FOR SELECT USING (true);
CREATE POLICY "nav_menus_insert" ON public.navigation_menus FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "nav_menus_update" ON public.navigation_menus FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "nav_menus_delete" ON public.navigation_menus FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── pages ─────────────────────────────────────────────────────────
-- Published pages are public; admins see all (including drafts)
CREATE POLICY "pages_select" ON public.pages FOR SELECT USING (
    is_published = true OR (SELECT public.is_admin())
);
CREATE POLICY "pages_insert" ON public.pages FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "pages_update" ON public.pages FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "pages_delete" ON public.pages FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── theme_settings ────────────────────────────────────────────────
CREATE POLICY "theme_select" ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY "theme_insert" ON public.theme_settings FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
);
CREATE POLICY "theme_update" ON public.theme_settings FOR UPDATE USING (
    (SELECT public.is_admin())
);
CREATE POLICY "theme_delete" ON public.theme_settings FOR DELETE USING (
    (SELECT public.is_admin())
);

-- ── Storage bucket policies (re-apply to be safe) ─────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'product-images' AND (SELECT public.is_admin())
    );

CREATE POLICY "product_images_admin_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'product-images' AND (SELECT public.is_admin())
    );

CREATE POLICY "product_images_admin_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'product-images' AND (SELECT public.is_admin())
    );

-- ── Verification ─────────────────────────────────────────────────
SELECT
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
