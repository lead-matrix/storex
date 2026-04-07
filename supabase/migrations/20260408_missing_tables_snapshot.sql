-- ─────────────────────────────────────────────────────────────
-- MIGRATION: Create missing tables and add order_items snapshots
-- ─────────────────────────────────────────────────────────────

-- 1. inventory_logs (referenced by lib/actions/admin.ts)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id     uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_id     uuid REFERENCES public.products(id) ON DELETE SET NULL,
    change_amount  integer NOT NULL,
    new_stock      integer NOT NULL,
    reason         text,
    admin_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory logs"
    ON public.inventory_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role can insert inventory logs"
    ON public.inventory_logs FOR INSERT
    WITH CHECK (true);


-- 2. builder_pages (referenced by app/admin/builder/actions.ts)
CREATE TABLE IF NOT EXISTS public.builder_pages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    title       text NOT NULL DEFAULT 'Untitled Page',
    blocks      jsonb NOT NULL DEFAULT '[]',
    published   boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published builder pages"
    ON public.builder_pages FOR SELECT
    USING (published = true);

CREATE POLICY "Admins have full access to builder pages"
    ON public.builder_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- 3. Snapshots for order_items
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
