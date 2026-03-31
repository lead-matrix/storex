-- =============================================================================
-- Migration: add_stripe_events_data_and_videos
-- Date: 2026-04-01
-- Purpose:
--   1. Add 'data' JSONB column to stripe_events (stores full Stripe event payload)
--   2. Add 'payment_status' column to orders (mirrors Stripe payment_status)
--   3. Create 'videos' table for Mux video asset management
-- All changes are additive / idempotent — safe to run on live DB.
-- =============================================================================

-- 1. stripe_events — store the full event payload for debugging & reprocessing
ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS data    JSONB,
  ADD COLUMN IF NOT EXISTS error   TEXT;

-- 2. orders — track payment_status separately from fulfillment status
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Backfill existing paid orders so the field is consistent
UPDATE public.orders
SET payment_status = 'paid'
WHERE status IN ('paid', 'shipped', 'delivered')
  AND payment_status IS NULL;

-- 3. videos — Mux asset registry
CREATE TABLE IF NOT EXISTS public.videos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT,
  description      TEXT,
  mux_asset_id     TEXT        NOT NULL,
  mux_playback_id  TEXT        NOT NULL,
  mux_upload_id    TEXT,                  -- Direct Upload tracking ID
  thumbnail_url    TEXT,
  status           TEXT        DEFAULT 'processing',  -- processing | ready | errored
  duration         NUMERIC,
  aspect_ratio     TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups in the Media Manager
CREATE INDEX IF NOT EXISTS idx_videos_mux_asset_id   ON public.videos (mux_asset_id);
CREATE INDEX IF NOT EXISTS idx_videos_mux_upload_id  ON public.videos (mux_upload_id);
CREATE INDEX IF NOT EXISTS idx_videos_status         ON public.videos (status);

-- RLS: only service-role (admin) can write; anon/authenticated can read
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_read_public"  ON public.videos;
DROP POLICY IF EXISTS "videos_write_admin"  ON public.videos;

CREATE POLICY "videos_read_public"
  ON public.videos FOR SELECT
  USING (true);

-- Writes come through the API using the service-role key, which bypasses RLS.
-- The policy below is a safety net for future authenticated-admin writes.
CREATE POLICY "videos_write_admin"
  ON public.videos FOR ALL
  USING (auth.role() = 'service_role');

-- Done. No destructive changes.
