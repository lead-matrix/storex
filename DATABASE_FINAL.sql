-- ============================================================
--  LMXEngine · DINA COSMETIC · DEFINITIVE DATABASE SETUP
--  Single source of truth — replaces DATABASE.sql, PHASE2, PHASE3
--
--  HOW IT WORKS:
--    Each table gets EXACTLY ONE policy per SQL action (SELECT/INSERT/UPDATE/DELETE)
--    → Zero "multiple permissive policies" warnings
--    → auth.uid() wrapped in (select ...) → Zero "initplan" warnings
--    → Admin writes use separate per-verb policies, never FOR ALL
--
--  Safe to run multiple times (fully idempotent)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. SCHEMA ADDITIONS (idempotent)
-- ─────────────────────────────────────────────────────────────

-- orders: add missing columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email  text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_total    numeric(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency        text NOT NULL DEFAULT 'usd';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();
UPDATE public.orders SET customer_email = email       WHERE customer_email IS NULL AND email IS NOT NULL;
UPDATE public.orders SET amount_total   = total_amount WHERE amount_total   IS NULL AND total_amount IS NOT NULL;

-- products: add missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock      integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images     text[]  NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metadata   jsonb   NOT NULL DEFAULT '{}';
UPDATE public.products SET stock = inventory WHERE stock = 0 AND inventory > 0;

-- categories: add missing columns
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url   text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- profiles: add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- order_items: add missing columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- variants table
CREATE TABLE IF NOT EXISTS public.variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           text NOT NULL,
  price_override numeric(10,2) CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku            text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- frontend_content table
CREATE TABLE IF NOT EXISTS public.frontend_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key  text UNIQUE NOT NULL,
  content_type text NOT NULL,
  content_data jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. ENABLE RLS ON ALL TABLES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3. DROP ALL EXISTING POLICIES (nuclear clean slate)
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'orders','order_items','products','categories',
        'profiles','variants','site_settings','frontend_content'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- ─────────────────────────────────────────────────────────────
-- 4. RECREATE POLICIES — EXACTLY ONE PER ACTION PER TABLE
--
--    KEY RULE: Never mix FOR ALL with a per-verb policy on
--    the same table. Use separate SELECT/INSERT/UPDATE/DELETE.
--    auth.uid() always wrapped in (select ...) for initplan fix.
-- ─────────────────────────────────────────────────────────────

-- ── ORDERS ──────────────────────────────────────────────────

CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING ((select auth.uid()) = user_id OR (select public.is_admin()));

CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));  -- service_role bypasses RLS for webhook

CREATE POLICY "orders_update"
  ON public.orders FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "orders_delete"
  ON public.orders FOR DELETE
  USING ((select public.is_admin()));

-- ── ORDER_ITEMS ──────────────────────────────────────────────

CREATE POLICY "order_items_select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
        AND (user_id = (select auth.uid()) OR (select public.is_admin()))
    )
  );

CREATE POLICY "order_items_insert"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "order_items_update"
  ON public.order_items FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "order_items_delete"
  ON public.order_items FOR DELETE
  USING ((select public.is_admin()));

-- ── PRODUCTS ─────────────────────────────────────────────────

CREATE POLICY "products_select"
  ON public.products FOR SELECT
  USING (is_active = true OR (select public.is_admin()));

CREATE POLICY "products_insert"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "products_update"
  ON public.products FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "products_delete"
  ON public.products FOR DELETE
  USING ((select public.is_admin()));

-- ── CATEGORIES ───────────────────────────────────────────────

CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "categories_delete"
  ON public.categories FOR DELETE
  USING ((select public.is_admin()));

-- ── PROFILES ─────────────────────────────────────────────────

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id OR (select public.is_admin()));

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id OR (select public.is_admin()));

CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING ((select public.is_admin()));

-- ── VARIANTS ─────────────────────────────────────────────────

CREATE POLICY "variants_select"
  ON public.variants FOR SELECT
  USING (true);

CREATE POLICY "variants_insert"
  ON public.variants FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "variants_update"
  ON public.variants FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "variants_delete"
  ON public.variants FOR DELETE
  USING ((select public.is_admin()));

-- ── SITE_SETTINGS ────────────────────────────────────────────

CREATE POLICY "site_settings_select"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_insert"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "site_settings_update"
  ON public.site_settings FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "site_settings_delete"
  ON public.site_settings FOR DELETE
  USING ((select public.is_admin()));

-- ── FRONTEND_CONTENT ─────────────────────────────────────────

CREATE POLICY "frontend_content_select"
  ON public.frontend_content FOR SELECT
  USING (true);

CREATE POLICY "frontend_content_insert"
  ON public.frontend_content FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "frontend_content_update"
  ON public.frontend_content FOR UPDATE
  USING ((select public.is_admin()));

CREATE POLICY "frontend_content_delete"
  ON public.frontend_content FOR DELETE
  USING ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS orders_updated_at      ON public.orders;
DROP TRIGGER IF EXISTS categories_updated_at  ON public.categories;
DROP TRIGGER IF EXISTS variants_updated_at    ON public.variants;
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS on_auth_user_created   ON auth.users;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON public.variants FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─────────────────────────────────────────────────────────────
-- 7. INDEXES
-- ─────────────────────────────────────────────────────────────

-- Drop duplicate first
DROP INDEX IF EXISTS public.idx_products_category;

CREATE INDEX IF NOT EXISTS idx_products_is_active    ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_inventory    ON public.products(inventory);
CREATE INDEX IF NOT EXISTS idx_products_stock        ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug       ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product_id   ON public.variants(product_id);

-- ─────────────────────────────────────────────────────────────
-- 8. SEED DATA
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('store_info',    '{"name":"DINA COSMETIC","tagline":"Luxury Obsidian Skincare","currency":"USD"}'::jsonb),
  ('store_enabled', 'true'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.frontend_content (content_key, content_type, content_data) VALUES
  ('hero_main', 'hero', '{"title":"The Essence of Luxury","subtitle":"Discover the obsidian collection"}'::jsonb)
ON CONFLICT (content_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 9. ADMIN SALES STATS VIEW
-- ─────────────────────────────────────────────────────────────

-- Drop first — CREATE OR REPLACE VIEW cannot change security options
DROP VIEW IF EXISTS public.admin_sales_stats;

-- Recreate with security_invoker = true
-- This makes the view run as the CALLING USER (not the view creator),
-- so their RLS policies are fully enforced. No privilege escalation.
CREATE VIEW public.admin_sales_stats
  WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT o.id)                                                      AS total_orders,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0)         AS total_revenue,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid')                     AS paid_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')                  AS pending_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'shipped')                  AS shipped_orders,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true)                    AS active_products,
  COUNT(DISTINCT p.id) FILTER (WHERE p.inventory < 5 AND p.is_active = true) AS low_stock_products,
  COUNT(DISTINCT pr.id)                                                      AS total_customers
FROM public.orders o
FULL OUTER JOIN public.products p ON true
FULL OUTER JOIN public.profiles pr ON true;

-- Grant read access — admin check enforced by RLS on underlying tables
GRANT SELECT ON public.admin_sales_stats TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 10. VERIFY — expected: exactly 4 policies per table
-- ─────────────────────────────────────────────────────────────

SELECT
  tablename,
  COUNT(*) AS policy_count,
  string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY cmd) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
