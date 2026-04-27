-- ============================================================
-- STOREX — SAFE DELTA MIGRATION
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- Will NOT drop, truncate, or modify existing data
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. ORDERS — missing columns used by the app
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_session_id        text,
  ADD COLUMN IF NOT EXISTS shipping_label_url        text,
  ADD COLUMN IF NOT EXISTS customer_name             text,
  ADD COLUMN IF NOT EXISTS customer_phone            text,
  ADD COLUMN IF NOT EXISTS tracking_number           text,
  ADD COLUMN IF NOT EXISTS carrier                   text,
  ADD COLUMN IF NOT EXISTS shippo_tracking_status    text,
  ADD COLUMN IF NOT EXISTS metadata                  jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at                timestamptz DEFAULT now();

-- Unique index on stripe_session_id (safe — only creates if missing)
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_key
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Index on stripe_payment_intent_id for refund lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Ensure orders_status_check constraint includes all used statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending','paid','shipped','out_for_delivery','delivered','cancelled','refunded')
);

-- ──────────────────────────────────────────────────────────────
-- 2. PAGE VIEWS — analytics tracking (was missing entirely)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_views (
  id           bigserial PRIMARY KEY,
  path         text        NOT NULL,
  referrer     text,
  country      text        DEFAULT 'Unknown',
  country_code text        DEFAULT 'XX',
  city         text,
  device       text        DEFAULT 'desktop',
  session_id   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_country_code
  ON public.page_views (country_code);

CREATE INDEX IF NOT EXISTS idx_page_views_path
  ON public.page_views (path);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_insert"  ON public.page_views;
DROP POLICY IF EXISTS "admin_select"    ON public.page_views;

CREATE POLICY "service_insert" ON public.page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_select" ON public.page_views
  FOR SELECT USING (auth.role() = 'authenticated');

GRANT ALL ON public.page_views TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO service_role;

-- ──────────────────────────────────────────────────────────────
-- 3. ADMIN AUDIT LOGS — action logging (was missing entirely)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       text        NOT NULL,
  target_table text,
  target_id    text,
  details      jsonb       DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id
  ON public.admin_audit_logs (admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at
  ON public.admin_audit_logs (created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_only" ON public.admin_audit_logs;

CREATE POLICY "admin_only" ON public.admin_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 4. NEWSLETTER SUBSCRIBERS — ensure table + RLS correct
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email
  ON public.newsletter_subscribers (email);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert"   ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "admin_all"       ON public.newsletter_subscribers;

-- Anyone can subscribe from the storefront
CREATE POLICY "public_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Only admins can read / delete subscribers
CREATE POLICY "admin_all" ON public.newsletter_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

GRANT ALL ON public.newsletter_subscribers TO service_role;

-- ──────────────────────────────────────────────────────────────
-- 5. ABANDONED CARTS — ensure table is complete
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text        NOT NULL,
  items          jsonb       NOT NULL DEFAULT '[]',
  amount_total   numeric     NOT NULL DEFAULT 0,
  recovery_token text        UNIQUE DEFAULT gen_random_uuid()::text,
  status         text        DEFAULT 'pending'
                 CHECK (status IN ('pending','recovered','emailed')),
  last_active    timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email
  ON public.abandoned_carts (customer_email);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status
  ON public.abandoned_carts (status);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON public.abandoned_carts;

CREATE POLICY "admin_all" ON public.abandoned_carts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

GRANT ALL ON public.abandoned_carts TO service_role;

-- ──────────────────────────────────────────────────────────────
-- 6. COUPONS — ensure table + used_count default
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text        UNIQUE NOT NULL,
  discount_type       text        NOT NULL CHECK (discount_type IN ('percentage','fixed_amount')),
  discount_value      numeric     NOT NULL,
  min_purchase_amount numeric     DEFAULT 0,
  max_uses            integer,
  used_count          integer     NOT NULL DEFAULT 0,
  status              text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- ──────────────────────────────────────────────────────────────
-- 7. PROFILES — ensure role column exists
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Ensure your admin email has the admin role
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@dinacosmatic.store';

-- ──────────────────────────────────────────────────────────────
-- 8. FRONTEND CONTENT — seed required rows if missing
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES ('site_social_links', 'json', '{"instagram":"","tiktok":"","facebook":"","youtube":"","pinterest":""}')
ON CONFLICT (content_key) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 9. SITE SETTINGS — seed social_media row if missing
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('social_media', '{"instagram":"","tiktok":"","facebook":"","youtube":"","pinterest":""}')
ON CONFLICT (setting_key) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 10. AUTO-PURGE page_views older than 90 days (keep table lean)
-- Schedule this manually in Supabase cron if desired:
-- SELECT cron.schedule('purge-old-page-views','0 3 * * *',
--   $$DELETE FROM public.page_views WHERE created_at < now() - interval '90 days'$$);
-- ──────────────────────────────────────────────────────────────

-- Done ✅
