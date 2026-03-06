-- CMS Update Script (Aligning to Audit)
-- 1. Create site_pages table
CREATE TABLE IF NOT EXISTS public.site_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    meta_title text,
    meta_desc text,
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- 2. Create site_blocks (or content_blocks) table
CREATE TABLE IF NOT EXISTS public.site_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid REFERENCES public.site_pages(id) ON DELETE CASCADE,
    type text NOT NULL,
    -- e.g., 'hero', 'productGrid', 'richText', 'imageBanner'
    props jsonb NOT NULL DEFAULT '{}',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_blocks ENABLE ROW LEVEL SECURITY;
-- Add RLS Policies
CREATE POLICY "site_pages_select" ON public.site_pages FOR
SELECT USING (
        is_published = true
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "site_pages_admin_all" ON public.site_pages FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
CREATE POLICY "site_blocks_select" ON public.site_blocks FOR
SELECT USING (true);
CREATE POLICY "site_blocks_admin_all" ON public.site_blocks FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- Note: Update Profile rule if running directly
-- UPDATE profiles SET role = 'admin' WHERE email = 'leadmatrix.us@gmail.com';