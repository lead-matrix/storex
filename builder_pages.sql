-- ─────────────────────────────────────────────────────────────────────────────
-- BUILDER PAGES TABLE
-- Run this in your Supabase SQL Editor (Database > SQL Editor > New Query)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.builder_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT 'Untitled Page',
    blocks JSONB NOT NULL DEFAULT '[]',
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for fast slug lookups on the public /pages/[slug] route
CREATE INDEX IF NOT EXISTS idx_builder_pages_slug ON public.builder_pages (slug);
CREATE INDEX IF NOT EXISTS idx_builder_pages_published ON public.builder_pages (published);
-- RLS: Enable Row Level Security
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;
-- Public can only read published pages
CREATE POLICY "Public can read published pages" ON public.builder_pages FOR
SELECT USING (published = true);
-- Authenticated admins can do everything
-- (The admin check uses service role key in server actions, so this covers direct access)
CREATE POLICY "Admins can manage all pages" ON public.builder_pages FOR ALL USING (auth.role() = 'authenticated');