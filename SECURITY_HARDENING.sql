-- =============================================================================
-- SECURITY HARDENING MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- Fixes all warnings from the Supabase Security Linter:
--   1. function_search_path_mutable          (16 functions)
--   2. anon_security_definer_function_executable (admin-only functions)
--   3. rls_policy_always_true                (newsletter_subscribers, page_views)
-- Safe to run multiple times (idempotent).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 · FIX MUTABLE search_path ON ALL FLAGGED FUNCTIONS
-- ALTER FUNCTION ... SET search_path = '' is the recommended fix.
-- Using '' (empty string) is safer than 'public' — forces fully-qualified names.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.get_customer_segments()         SET search_path = '';
ALTER FUNCTION public.delete_recovered_cart(text)     SET search_path = '';
ALTER FUNCTION public.upsert_abandoned_cart(text, jsonb, numeric) SET search_path = '';
ALTER FUNCTION public.mark_cart_recovered(text)       SET search_path = '';
ALTER FUNCTION public.get_segment_counts()            SET search_path = '';
ALTER FUNCTION public.check_rate_limit(text, text, integer, integer) SET search_path = '';
ALTER FUNCTION public.admin_alltime_stats()           SET search_path = '';
ALTER FUNCTION public.get_segment_emails(text)        SET search_path = '';
ALTER FUNCTION public.validate_coupon(text, numeric)  SET search_path = '';
ALTER FUNCTION public.get_active_subscribers()        SET search_path = '';
ALTER FUNCTION public.redeem_coupon(uuid)             SET search_path = '';
ALTER FUNCTION public.admin_revenue_sparkline(integer) SET search_path = '';
ALTER FUNCTION public.unsubscribe_by_token(text)      SET search_path = '';
ALTER FUNCTION public.admin_today_stats(timestamptz, timestamptz) SET search_path = '';
ALTER FUNCTION public.get_shipping_config()           SET search_path = '';
ALTER FUNCTION public.get_subscriber_stats()          SET search_path = '';


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 · REVOKE anon EXECUTE ON ADMIN / INTERNAL FUNCTIONS
-- These functions must only be called by authenticated admins (via service-role
-- API routes), never directly by anonymous visitors.
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin stats / analytics
REVOKE EXECUTE ON FUNCTION public.admin_alltime_stats()                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revenue_sparkline(integer)                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_today_stats(timestamptz, timestamptz)        FROM anon;

-- Customer / segment tools (admin CRM)
REVOKE EXECUTE ON FUNCTION public.get_customer_segments()                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_segment_counts()                               FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_segment_emails(text)                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_subscribers()                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_subscriber_stats()                             FROM anon;

-- Abandoned cart management (internal / server-only)
REVOKE EXECUTE ON FUNCTION public.upsert_abandoned_cart(text, jsonb, numeric)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_cart_recovered(text)                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_recovered_cart(text)                        FROM anon;

-- Coupon redemption (authenticated checkout only, not open API)
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(uuid)                                FROM anon;

-- Inventory / order internals (called only from server-side webhooks)
REVOKE EXECUTE ON FUNCTION public.check_and_reserve_inventory(jsonb, uuid, interval) FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_order_inventory(uuid)                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_reservations()                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_stale_pending_orders()                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer)                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_order_atomic(text, text, bigint, text, jsonb, jsonb, jsonb) FROM anon;

-- Trigger functions (should never be callable via REST API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at()                                FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_inventory_change()                             FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_product_manifest()                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_product_stock()                               FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()                                  FROM anon;

-- Shipping config (server-side only)
REVOKE EXECUTE ON FUNCTION public.get_shipping_config()                              FROM anon;

-- is_admin helper (used internally by RLS policies, not for direct REST calls)
REVOKE EXECUTE ON FUNCTION public.is_admin()                                         FROM anon;

-- NOTE: We intentionally KEEP anon EXECUTE on:
--   public.validate_coupon    — customers validate coupons at checkout (anon flow)
--   public.unsubscribe_by_token — email unsubscribe links work without login
--   public.check_rate_limit   — called server-side but needs to be kept callable
--   public.get_shipping_config — only revoked above; re-grant if used client-side


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 · FIX OVERLY PERMISSIVE RLS INSERT POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. newsletter_subscribers — restrict anon INSERT to valid email format only
DROP POLICY IF EXISTS "anon_insert" ON public.newsletter_subscribers;
CREATE POLICY "anon_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 3
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

-- 3b. page_views — restrict INSERT to service_role only (no anon writes needed)
DROP POLICY IF EXISTS "service_insert" ON public.page_views;
CREATE POLICY "service_insert"
  ON public.page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- Done. Verify with:
--   SELECT proname, prosecdef, proconfig
--   FROM pg_proc
--   JOIN pg_namespace ON pg_namespace.oid = pronamespace
--   WHERE nspname = 'public'
--   ORDER BY proname;
-- =============================================================================
