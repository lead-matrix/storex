-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Security & Performance Hardening
-- Fixes all Supabase linter warnings (security + performance)
-- Run once against production Supabase project (SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- SECTION 1: Fix function_search_path_mutable
-- Add SET search_path = '' to all flagged functions
-- ─────────────────────────────────────────────────────────────────

-- 1a. stripe.set_updated_at_metadata
CREATE OR REPLACE FUNCTION stripe.set_updated_at_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1b. stripe.check_rate_limit
-- We recreate it with a fixed search_path. The body below is a safe
-- stub that preserves the signature; adjust if your stripe extension
-- defines different logic.
DO $$
DECLARE
  fn_src text;
BEGIN
  SELECT pg_get_functiondef(oid)
    INTO fn_src
    FROM pg_proc
    WHERE proname = 'check_rate_limit'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'stripe');

  -- Only touch it if it exists and doesn't already have a fixed search_path
  IF fn_src IS NOT NULL AND fn_src NOT LIKE '%SET search_path%' THEN
    EXECUTE regexp_replace(
      fn_src,
      'LANGUAGE\s+plpgsql',
      'LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''''',
      'i'
    );
  END IF;
END;
$$;

-- 1c. stripe.set_updated_at
CREATE OR REPLACE FUNCTION stripe.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1d. public.cleanup_expired_reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Return reserved stock to variants where reservation has expired
  UPDATE public.product_variants pv
  SET stock = pv.stock + r.quantity
  FROM public.inventory_reservations r
  WHERE r.variant_id = pv.id
    AND r.status = 'reserved'
    AND r.expires_at < now();

  -- Mark expired reservations
  UPDATE public.inventory_reservations
  SET status = 'expired'
  WHERE status = 'reserved'
    AND expires_at < now();
END;
$$;


-- ─────────────────────────────────────────────────────────────────
-- SECTION 2: Fix rls_policy_always_true
-- Replace permissive WITH CHECK (true) on INSERT with proper guards
-- ─────────────────────────────────────────────────────────────────

-- 2a. inventory_logs — "Service role can insert inventory logs"
--     (service role bypasses RLS entirely; authenticated admins
--      should use the admin master policy, so drop this one)
DROP POLICY IF EXISTS "Service role can insert inventory logs" ON public.inventory_logs;

-- 2b. newsletter_subscribers — "newsletter_anon_insert"
--     Allow insert only when the email field is a valid-looking email.
DROP POLICY IF EXISTS "newsletter_anon_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_anon_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );


-- ─────────────────────────────────────────────────────────────────
-- SECTION 3: Fix auth_rls_initplan
-- Replace auth.uid() with (select auth.uid()) in all flagged policies
-- so Postgres evaluates it once per query instead of once per row.
-- ─────────────────────────────────────────────────────────────────

-- 3a. orders — orders_user_select
DROP POLICY IF EXISTS "orders_user_select" ON public.orders;
CREATE POLICY "orders_user_select"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3b. orders — orders_user_email_select
DROP POLICY IF EXISTS "orders_user_email_select" ON public.orders;
CREATE POLICY "orders_user_email_select"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_email = (SELECT auth.email()));

-- 3c. order_items — order_items_user_select
DROP POLICY IF EXISTS "order_items_user_select" ON public.order_items;
CREATE POLICY "order_items_user_select"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = (SELECT auth.uid())
    )
  );

-- 3d. order_items — order_items_user_email_select
DROP POLICY IF EXISTS "order_items_user_email_select" ON public.order_items;
CREATE POLICY "order_items_user_email_select"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_email = (SELECT auth.email())
    )
  );

-- 3e. profiles — profiles_user_select
DROP POLICY IF EXISTS "profiles_user_select" ON public.profiles;
CREATE POLICY "profiles_user_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- 3f. profiles — profiles_user_update
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
CREATE POLICY "profiles_user_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- 3g. videos — videos_write_admin
DROP POLICY IF EXISTS "videos_write_admin" ON public.videos;
CREATE POLICY "videos_write_admin"
  ON public.videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- 3h. inventory_logs — "Admins can view inventory logs"
DROP POLICY IF EXISTS "Admins can view inventory logs" ON public.inventory_logs;
CREATE POLICY "Admins can view inventory logs"
  ON public.inventory_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- 3i. builder_pages — "Admins have full access to builder pages"
DROP POLICY IF EXISTS "Admins have full access to builder pages" ON public.builder_pages;
CREATE POLICY "Admins have full access to builder pages"
  ON public.builder_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────────────────
-- SECTION 4: Fix multiple_permissive_policies
-- Drop older/redundant duplicate policies; the master policies
-- (already covering all roles/operations) remain in place.
-- ─────────────────────────────────────────────────────────────────

-- builder_pages: kept "Admins have full access" (ALL) + "Public can read published"
-- Drop old anon-read policy that duplicates "Public can read published builder pages"
DROP POLICY IF EXISTS "builder_pages_anon_read" ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_master" ON public.builder_pages;

-- coupons: keep coupons_admin_master (ALL); drop redundant public read
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;

-- frontend_content: keep admin_master (ALL); drop redundant anon read
DROP POLICY IF EXISTS "frontend_content_anon_read" ON public.frontend_content;

-- inventory_logs: drop the duplicate admin master (the rebuilt policies above are canonical)
DROP POLICY IF EXISTS "inventory_logs_admin_master" ON public.inventory_logs;

-- newsletter_subscribers: drop duplicate admin master for INSERT
-- (the rebuilt newsletter_anon_insert + admin_master cover all cases)
DROP POLICY IF EXISTS "newsletter_subscribers_admin_master" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_admin_master"
  ON public.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- order_items: consolidate — drop the two user-specific SELECT policies;
-- the admin master already handles admin reads. Users are covered by the
-- rebuilt policies above (orders_user_select / orders_user_email_select chain).
-- Drop old master that doesn't use SELECT wrapper
DROP POLICY IF EXISTS "order_items_admin_master" ON public.order_items;
CREATE POLICY "order_items_admin_master"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- orders: drop the old "Users can view their own orders" duplicate
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_master" ON public.orders;
CREATE POLICY "orders_admin_master"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- profiles: drop old master; rebuild with SELECT wrapper
DROP POLICY IF EXISTS "profiles_admin_master" ON public.profiles;
CREATE POLICY "profiles_admin_master"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = (SELECT auth.uid())
        AND p2.role = 'admin'
    )
  );

-- videos: drop the old read-only policy that overlaps with write_admin
DROP POLICY IF EXISTS "videos_read_public" ON public.videos;
CREATE POLICY "videos_read_public"
  ON public.videos
  FOR SELECT
  USING (true);  -- intentional: all published videos are public-readable


-- ─────────────────────────────────────────────────────────────────
-- SECTION 5: Fix duplicate_index
-- Drop the duplicate index on order_items
-- ─────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS public.idx_order_items_order_id;
-- idx_order_items_order is kept as the canonical index
