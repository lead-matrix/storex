-- ============================================================
--  LMXEngine · DINA COSMETIC · PHASE 2 SCHEMA EXPANSION
--  Run this in Supabase SQL Editor → New Query
--  SELF-CONTAINED: Works even if DATABASE.sql was not run first.
--  Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. PREREQUISITES — ensure core helpers exist
-- ─────────────────────────────────────────────

-- is_admin() helper (idempotent)
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

-- updated_at trigger function (idempotent)
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

-- ─────────────────────────────────────────────
-- 1. FIX ORDERS TABLE (add missing user_id column)
-- ─────────────────────────────────────────────
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Fix the RLS policy that was failing due to missing user_id
DROP POLICY IF EXISTS "Users view own orders." ON public.orders;
CREATE POLICY "Users view own orders." ON public.orders 
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- ─────────────────────────────────────────────
-- 2. VARIANTS TABLE
-- ─────────────────────────────────────────────
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
CREATE POLICY "Anyone can view variants." ON public.variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage variants." ON public.variants;
CREATE POLICY "Admins manage variants." ON public.variants FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);

DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
CREATE TRIGGER variants_updated_at 
  BEFORE UPDATE ON public.variants 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────────
-- 3. ORDER_ITEMS RLS POLICY (missing from original)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 4. ADMIN SALES STATS VIEW
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.admin_sales_stats AS
SELECT
  COUNT(DISTINCT o.id)                                          AS total_orders,
  COALESCE(SUM(o.amount_total) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid')         AS paid_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')      AS pending_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'shipped')      AS shipped_orders,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true)        AS active_products,
  COUNT(DISTINCT p.id) FILTER (WHERE p.stock < 5 AND p.is_active = true) AS low_stock_products,
  COUNT(DISTINCT pr.id)                                          AS total_customers
FROM public.orders o
FULL OUTER JOIN public.products p ON true
FULL OUTER JOIN public.profiles pr ON true;

-- Grant read access to authenticated users (admin check done at app level)
GRANT SELECT ON public.admin_sales_stats TO authenticated;

-- ─────────────────────────────────────────────
-- 5. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ─────────────────────────────────────────────
-- 6. SEED: Add store_enabled setting if missing
-- ─────────────────────────────────────────────
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('store_enabled', 'true'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 7. VERIFY: Check everything is in order
-- ─────────────────────────────────────────────
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'products', 'variants', 'order_items', 'profiles', 'categories', 'site_settings', 'frontend_content')
ORDER BY tablename;
