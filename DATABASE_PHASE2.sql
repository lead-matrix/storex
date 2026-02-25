-- ============================================================
--  LMXEngine · DINA COSMETIC · PHASE 2 SCHEMA ALIGNMENT
--  AUDITED against actual Supabase DB: zsahskxejgbrvfhobfyp
--  Run this in Supabase SQL Editor → New Query
--  Safe to run multiple times (idempotent)
-- ============================================================
--
--  ACTUAL DB STATE (discovered via API):
--  orders      → has: id, stripe_session_id, email, status, total_amount,
--                      shipping_address, shippo_label_id, created_at, user_id
--  products    → has: id, category_id, name, slug, description, price,
--                      compare_at_price, sku, inventory, is_active,
--                      stripe_price_id, created_at, updated_at
--  order_items → has: id, order_id, product_id, quantity, price
--  profiles    → has: id, email, full_name, role, created_at
--  categories  → has: id, name, slug, created_at
--  variants    → MISSING (needs creation)
--  site_settings    → MISSING (needs creation)
--  frontend_content → MISSING (needs creation)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. PREREQUISITES — helper functions (idempotent)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. ALIGN ORDERS TABLE
--    Add missing columns the app code expects
-- ─────────────────────────────────────────────────────────────

-- App code uses customer_email — add as alias column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email text;

-- Copy existing email values into customer_email
UPDATE public.orders
  SET customer_email = email
  WHERE customer_email IS NULL AND email IS NOT NULL;

-- App code uses amount_total — add as alias column  
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS amount_total numeric(10,2);

-- Copy existing total_amount values into amount_total
UPDATE public.orders
  SET amount_total = total_amount
  WHERE amount_total IS NULL AND total_amount IS NOT NULL;

-- Add missing fields the app writes to
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'usd';
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfillment_status IN ('unfulfilled','fulfilled'));
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Status constraint — ensure it matches app expectations
-- (existing check may differ; add only if not present)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded'));
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- constraint already exists
  END;
END$$;

-- RLS (enable if not already)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own orders." ON public.orders;
CREATE POLICY "Users view own orders." ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins manage all orders." ON public.orders;
CREATE POLICY "Admins manage all orders." ON public.orders
  FOR ALL USING (is_admin());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. ALIGN PRODUCTS TABLE
--    DB has: inventory (not stock), no images, no is_featured
-- ─────────────────────────────────────────────────────────────

-- App code uses 'stock' — add as alias
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

-- Copy inventory → stock
UPDATE public.products
  SET stock = inventory
  WHERE stock = 0 AND inventory > 0;

-- Add missing product fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products." ON public.products;
CREATE POLICY "Anyone can view active products." ON public.products
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins manage products." ON public.products;
CREATE POLICY "Admins manage products." ON public.products
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 3. ALIGN CATEGORIES TABLE
--    DB has: id, name, slug, created_at — missing description/image_url/updated_at
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories." ON public.categories;
CREATE POLICY "Anyone can view categories." ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories." ON public.categories;
CREATE POLICY "Admins manage categories." ON public.categories
  FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. ALIGN PROFILES TABLE
--    DB has: id, email, full_name, role, created_at — missing avatar_url/updated_at
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage all profiles." ON public.profiles;
CREATE POLICY "Admins manage all profiles." ON public.profiles
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 5. ALIGN ORDER_ITEMS TABLE
--    DB has: id, order_id, product_id, quantity, price — missing created_at
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own order items." ON public.order_items;
CREATE POLICY "Users view own order items." ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage order items." ON public.order_items;
CREATE POLICY "Admins manage order items." ON public.order_items
  FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 6. CREATE VARIANTS TABLE (does not exist)
-- ─────────────────────────────────────────────────────────────

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

ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view variants." ON public.variants;
CREATE POLICY "Anyone can view variants." ON public.variants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage variants." ON public.variants;
CREATE POLICY "Admins manage variants." ON public.variants
  FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON public.variants
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. CREATE SITE_SETTINGS TABLE (does not exist)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings." ON public.site_settings;
CREATE POLICY "Anyone can view site settings." ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site settings." ON public.site_settings;
CREATE POLICY "Admins manage site settings." ON public.site_settings
  FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Seed default settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('store_info',    '{"name": "DINA COSMETIC", "tagline": "Luxury Obsidian Skincare", "currency": "USD"}'::jsonb),
  ('store_enabled', 'true'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 8. CREATE FRONTEND_CONTENT TABLE (does not exist)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.frontend_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key  text UNIQUE NOT NULL,
  content_type text NOT NULL,
  content_data jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site content." ON public.frontend_content;
CREATE POLICY "Anyone can view site content." ON public.frontend_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site content." ON public.frontend_content;
CREATE POLICY "Admins manage site content." ON public.frontend_content
  FOR ALL USING (is_admin());

-- Seed hero content
INSERT INTO public.frontend_content (content_key, content_type, content_data) VALUES
  ('hero_main', 'hero', '{"title": "The Essence of Luxury", "subtitle": "Discover the obsidian collection"}'::jsonb)
ON CONFLICT (content_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
CREATE POLICY "Admin Insert Access" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
CREATE POLICY "Admin Update Access" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
CREATE POLICY "Admin Delete Access" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND is_admin());

-- ─────────────────────────────────────────────────────────────
-- 10. AUTH TRIGGER — new user → profile
-- ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 11. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_is_active    ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_inventory     ON public.products(inventory);
CREATE INDEX IF NOT EXISTS idx_products_stock         ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug        ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product_id    ON public.variants(product_id);

-- ─────────────────────────────────────────────────────────────
-- 12. ADMIN SALES STATS VIEW
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_sales_stats AS
SELECT
  COUNT(DISTINCT o.id)                                                    AS total_orders,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0)       AS total_revenue,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid')                   AS paid_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')                AS pending_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'shipped')                AS shipped_orders,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true)                  AS active_products,
  COUNT(DISTINCT p.id) FILTER (WHERE p.inventory < 5 AND p.is_active)     AS low_stock_products,
  COUNT(DISTINCT pr.id)                                                    AS total_customers
FROM public.orders o
FULL OUTER JOIN public.products p ON true
FULL OUTER JOIN public.profiles pr ON true;

GRANT SELECT ON public.admin_sales_stats TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 13. VERIFY — final state check
-- ─────────────────────────────────────────────────────────────

SELECT
  tablename,
  rowsecurity AS rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
