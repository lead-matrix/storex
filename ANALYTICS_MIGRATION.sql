-- ============================================================
-- Real-time web analytics: page_views table
-- Run this in your Supabase SQL editor once
-- ============================================================

CREATE TABLE IF NOT EXISTS public.page_views (
  id          bigserial PRIMARY KEY,
  path        text NOT NULL,
  referrer    text,
  country     text DEFAULT 'Unknown',
  country_code text DEFAULT 'XX',
  city        text,
  device      text DEFAULT 'desktop',
  session_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast time-range queries (used by all stats endpoints)
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);

-- Index for country aggregation
CREATE INDEX IF NOT EXISTS idx_page_views_country_code ON public.page_views (country_code);

-- Auto-purge rows older than 90 days to keep the table lean
-- (Run this as a Supabase cron job or manually periodically)
-- DELETE FROM public.page_views WHERE created_at < now() - interval '90 days';

-- RLS: Only service role can insert/select (admin-only stats endpoint uses service role)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the tracking API (uses service role via supabaseAdmin)
CREATE POLICY "service_insert" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read (admin panel)
CREATE POLICY "admin_select" ON public.page_views
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role full access (bypasses RLS anyway, but explicit is clear)
GRANT ALL ON public.page_views TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO service_role;
