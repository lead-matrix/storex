-- =============================================================================
-- RLS FINAL FIX — Eliminates all multiple_permissive_policies warnings
--
-- Root cause: a FOR ALL policy also covers SELECT, so having a separate
-- FOR SELECT policy creates two permissive SELECT policies per role.
--
-- Solution: ONE combined SELECT policy (public OR admin), then separate
-- INSERT / UPDATE / DELETE policies for admins only. Zero overlap.
-- =============================================================================
-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
-- Single SELECT: public sees active products; admins see everything
CREATE POLICY "products_select" ON public.products FOR
SELECT USING (
        status = 'active'
        OR (
            (
                select auth.role()
            ) = 'authenticated'
            AND (
                select role
                FROM public.profiles
                WHERE id = (
                        select auth.uid()
                    )
            ) = 'admin'
        )
    );
-- Admin-only mutations (no SELECT overlap)
CREATE POLICY "products_insert" ON public.products FOR
INSERT WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "products_update" ON public.products FOR
UPDATE USING (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    ) WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (
    (
        select auth.role()
    ) = 'authenticated'
    AND (
        select role
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
    ) = 'admin'
);
-- ─────────────────────────────────────────────────────────────────────────────
-- PAGES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pages_public_read" ON public.pages;
DROP POLICY IF EXISTS "pages_admin_all" ON public.pages;
CREATE POLICY "pages_select" ON public.pages FOR
SELECT USING (
        is_published = true
        OR (
            (
                select auth.role()
            ) = 'authenticated'
            AND (
                select role
                FROM public.profiles
                WHERE id = (
                        select auth.uid()
                    )
            ) = 'admin'
        )
    );
CREATE POLICY "pages_insert" ON public.pages FOR
INSERT WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "pages_update" ON public.pages FOR
UPDATE USING (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    ) WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "pages_delete" ON public.pages FOR DELETE USING (
    (
        select auth.role()
    ) = 'authenticated'
    AND (
        select role
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
    ) = 'admin'
);
-- ─────────────────────────────────────────────────────────────────────────────
-- BUILDER_PAGES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "builder_pages_public_read" ON public.builder_pages;
DROP POLICY IF EXISTS "builder_pages_admin_all" ON public.builder_pages;
CREATE POLICY "builder_pages_select" ON public.builder_pages FOR
SELECT USING (
        published = true
        OR (
            (
                select auth.role()
            ) = 'authenticated'
            AND (
                select role
                FROM public.profiles
                WHERE id = (
                        select auth.uid()
                    )
            ) = 'admin'
        )
    );
CREATE POLICY "builder_pages_insert" ON public.builder_pages FOR
INSERT WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "builder_pages_update" ON public.builder_pages FOR
UPDATE USING (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    ) WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
        AND (
            select role
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "builder_pages_delete" ON public.builder_pages FOR DELETE USING (
    (
        select auth.role()
    ) = 'authenticated'
    AND (
        select role
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
    ) = 'admin'
);
-- =============================================================================
-- VERIFICATION — run these after to confirm exactly 4 policies per table
-- =============================================================================
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('products','pages','builder_pages')
-- ORDER BY tablename, cmd;
-- =============================================================================