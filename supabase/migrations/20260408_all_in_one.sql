-- ═══════════════════════════════════════════════════════════════════════════════
-- ALL-IN-ONE MIGRATION · DINA COSMETIC / STOREX
-- Combines every change from the April 8 2026 session into a single idempotent
-- script. Safe to run on a fresh project or on top of the existing schema.
--
-- Sections:
--   1. Missing tables   — inventory_logs, builder_pages
--   2. Schema columns   — order_items snapshots (product_name, variant_name)
--   3. Function security — SET search_path = '' on all public functions
--   4. RLS policies     — Drop all old overlapping policies, rebuild clean set
--   5. Indexes          — Drop duplicate index on order_items
--   6. Admin user       — Ensure the owner account has role = 'admin'
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 · Missing Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. inventory_logs
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id     uuid        REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_id     uuid        REFERENCES public.products(id)         ON DELETE SET NULL,
    change_amount  integer     NOT NULL,
    new_stock      integer     NOT NULL,
    reason         text,
    admin_id       uuid        REFERENCES auth.users(id)              ON DELETE SET NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- 1b. builder_pages
CREATE TABLE IF NOT EXISTS public.builder_pages (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text        NOT NULL UNIQUE,
    title       text        NOT NULL DEFAULT 'Untitled Page',
    blocks      jsonb       NOT NULL DEFAULT '[]',
    published   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 · Schema Columns
-- ─────────────────────────────────────────────────────────────────────────────

-- order_items: add denormalised snapshot columns so fulfilled orders
-- retain product/variant names even if the source rows are deleted.
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS product_name text,
    ADD COLUMN IF NOT EXISTS variant_name text;

UPDATE public.order_items oi
SET
    product_name = COALESCE(oi.product_name, p.title),
    variant_name = COALESCE(oi.variant_name, pv.name)
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE oi.variant_id = pv.id
  AND (oi.product_name IS NULL OR oi.variant_name IS NULL);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 · Function Security (SET search_path = '')
-- ─────────────────────────────────────────────────────────────────────────────

-- public.cleanup_expired_reservations
-- DROP first: CREATE OR REPLACE cannot change return type
DROP FUNCTION IF EXISTS public.cleanup_expired_reservations();
CREATE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.product_variants pv
  SET stock = pv.stock + r.quantity
  FROM public.inventory_reservations r
  WHERE r.variant_id = pv.id
    AND r.status = 'reserved'
    AND r.expires_at < now();

  UPDATE public.inventory_reservations
  SET status = 'expired'
  WHERE status = 'reserved'
    AND expires_at < now();
END;
$$;

-- stripe.* functions — recreate with locked search_path
-- (these belong to Supabase's Stripe integration; we can replace the trigger
--  functions safely because their bodies are trivially known)
CREATE OR REPLACE FUNCTION stripe.set_updated_at_metadata()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION stripe.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- stripe.check_rate_limit — patch dynamically if it exists and isn't already fixed
DO $$
DECLARE fn_src text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO fn_src
  FROM pg_proc
  WHERE proname = 'check_rate_limit'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'stripe');
  IF fn_src IS NOT NULL AND fn_src NOT LIKE '%SET search_path%' THEN
    EXECUTE regexp_replace(fn_src, 'LANGUAGE\s+plpgsql',
      'LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''''', 'i');
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 · RLS Policies
-- Strategy:
--   • Drop every old/overlapping policy first (IF EXISTS — safe to re-run)
--   • Rebuild with per-operation policies (no FOR ALL) so exactly ONE policy
--     covers each role+action combination — eliminating all linter warnings
--   • All auth.uid() calls wrapped as (SELECT auth.uid()) for initplan fix
-- ─────────────────────────────────────────────────────────────────────────────

-- ── helpers ──────────────────────────────────────────────────────────────────
-- Reusable inline: EXISTS (SELECT 1 FROM profiles WHERE id=(SELECT auth.uid()) AND role='admin')
-- Written inline per policy below for clarity.

-- ── ORDERS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_user_select"             ON public.orders;
DROP POLICY IF EXISTS "orders_user_email_select"       ON public.orders;
DROP POLICY IF EXISTS "orders_admin_master"            ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select"                  ON public.orders;
DROP POLICY IF EXISTS "orders_admin_write"             ON public.orders;
DROP POLICY IF EXISTS "orders_admin_insert"            ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update"            ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete"            ON public.orders;

CREATE POLICY "orders_select"
  ON public.orders FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR customer_email = (SELECT auth.email())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "orders_admin_insert"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "orders_admin_update"
  ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "orders_admin_delete"
  ON public.orders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── ORDER_ITEMS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "order_items_user_select"          ON public.order_items;
DROP POLICY IF EXISTS "order_items_user_email_select"    ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_master"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_select"               ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_write"          ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_insert"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_update"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_delete"         ON public.order_items;

CREATE POLICY "order_items_select"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.user_id = (SELECT auth.uid())
          OR o.customer_email = (SELECT auth.email())
          OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
        )
    )
  );

CREATE POLICY "order_items_admin_insert"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "order_items_admin_update"
  ON public.order_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "order_items_admin_delete"
  ON public.order_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── PROFILES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_user_select"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_master"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_select"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_write"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update"   ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin')
  );

-- Users can update their own profile; admins can update any
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin')
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin')
  );

CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin'));

CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin'));


-- ── INVENTORY_LOGS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view inventory logs"         ON public.inventory_logs;
DROP POLICY IF EXISTS "Service role can insert inventory logs"  ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_admin_master"             ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_select"                   ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_insert"                   ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_delete"                   ON public.inventory_logs;

CREATE POLICY "inventory_logs_select"
  ON public.inventory_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "inventory_logs_insert"
  ON public.inventory_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "inventory_logs_delete"
  ON public.inventory_logs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── BUILDER_PAGES ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins have full access to builder pages" ON public.builder_pages;
DROP POLICY IF EXISTS "Public can read published builder pages"  ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_anon_read"                  ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_master"               ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_select"                     ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_write"                ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_insert"               ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_update"               ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_delete"               ON public.builder_pages;

-- Public can read published pages; admins can read all
CREATE POLICY "builder_pages_select"
  ON public.builder_pages FOR SELECT
  USING (
    published = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

CREATE POLICY "builder_pages_admin_insert"
  ON public.builder_pages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "builder_pages_admin_update"
  ON public.builder_pages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "builder_pages_admin_delete"
  ON public.builder_pages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── NEWSLETTER_SUBSCRIBERS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "newsletter_anon_insert"               ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_admin_master"  ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_insert"                    ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_access"              ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_select"              ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_update"              ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_delete"              ON public.newsletter_subscribers;

-- Anyone with a valid email can subscribe (anon or authenticated)
CREATE POLICY "newsletter_insert"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

CREATE POLICY "newsletter_admin_select"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "newsletter_admin_update"
  ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "newsletter_admin_delete"
  ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── VIDEOS ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "videos_read_public"   ON public.videos;
DROP POLICY IF EXISTS "videos_write_admin"   ON public.videos;
DROP POLICY IF EXISTS "videos_select"        ON public.videos;
DROP POLICY IF EXISTS "videos_admin_write"   ON public.videos;
DROP POLICY IF EXISTS "videos_admin_insert"  ON public.videos;
DROP POLICY IF EXISTS "videos_admin_update"  ON public.videos;
DROP POLICY IF EXISTS "videos_admin_delete"  ON public.videos;

CREATE POLICY "videos_select"
  ON public.videos FOR SELECT
  USING (true); -- all videos are public-readable on the storefront

CREATE POLICY "videos_admin_insert"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "videos_admin_update"
  ON public.videos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "videos_admin_delete"
  ON public.videos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── COUPONS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "coupons_public_read"    ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_master"   ON public.coupons;
DROP POLICY IF EXISTS "coupons_select"         ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_insert"   ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_update"   ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_delete"   ON public.coupons;

-- Customers need to read coupons to validate codes at checkout
CREATE POLICY "coupons_select"
  ON public.coupons FOR SELECT
  USING (true);

CREATE POLICY "coupons_admin_insert"
  ON public.coupons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "coupons_admin_update"
  ON public.coupons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "coupons_admin_delete"
  ON public.coupons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ── FRONTEND_CONTENT ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "frontend_content_anon_read"      ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_admin_master"    ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_select"          ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_admin_insert"    ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_admin_update"    ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_admin_delete"    ON public.frontend_content;

CREATE POLICY "frontend_content_select"
  ON public.frontend_content FOR SELECT
  USING (true); -- storefront reads this publicly

CREATE POLICY "frontend_content_admin_insert"
  ON public.frontend_content FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "frontend_content_admin_update"
  ON public.frontend_content FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));

CREATE POLICY "frontend_content_admin_delete"
  ON public.frontend_content FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'));


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 · Indexes — drop the duplicate
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS public.idx_order_items_order_id;
-- idx_order_items_order is kept as the canonical index


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 · Admin User — guarantee the owner account has role = 'admin'
-- Replace the UUID and email below if deploying for a different store.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.profiles (id, email, role)
VALUES (
    'f0ec05c7-8661-48f3-8da7-faf1ca46bfe1',
    'admin@dinacosmetic.store',
    'admin'
)
ON CONFLICT (id) DO UPDATE
    SET role  = 'admin',
        email = EXCLUDED.email;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
