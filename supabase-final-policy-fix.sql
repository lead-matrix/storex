-- =====================================================
-- FINAL PERFORMANCE FIX
-- Eliminates remaining "Multiple Permissive Policies" warnings
-- Run this AFTER the main performance fixes
-- =====================================================

-- The issue: Admin and user policies both apply to 'authenticated' role
-- Solution: Use a single policy with OR logic instead of multiple policies

-- =====================================================
-- Fix PRODUCTS - Combine admin + public read into one SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_public_read" ON public.products;

-- Single SELECT policy (admin OR public active products)
CREATE POLICY "products_select" ON public.products
    FOR SELECT
    USING (
        is_active = true
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- Admin-only policies for modifications
CREATE POLICY "products_insert" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "products_update" ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "products_delete" ON public.products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- =====================================================
-- Fix VARIANTS - Combine admin + public read
-- =====================================================

DROP POLICY IF EXISTS "variants_admin_all" ON public.variants;
DROP POLICY IF EXISTS "variants_public_read" ON public.variants;

-- Single SELECT policy (always readable OR admin)
CREATE POLICY "variants_select" ON public.variants
    FOR SELECT
    USING (
        true
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- Admin-only modification policies
CREATE POLICY "variants_insert" ON public.variants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "variants_update" ON public.variants
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "variants_delete" ON public.variants
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- =====================================================
-- Fix CATEGORIES - Combine admin + public read
-- =====================================================

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;

-- Single SELECT policy
CREATE POLICY "categories_select" ON public.categories
    FOR SELECT
    USING (true);

-- Admin-only modification policies
CREATE POLICY "categories_insert" ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "categories_update" ON public.categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "categories_delete" ON public.categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- =====================================================
-- Fix ORDERS - Combine admin + user own orders
-- =====================================================

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "orders_users_own" ON public.orders;

-- Single SELECT policy (own orders OR admin)
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- Admin-only modification policies
CREATE POLICY "orders_insert" ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "orders_update" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "orders_delete" ON public.orders
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- =====================================================
-- Fix ORDER_ITEMS - Combine admin + user own items
-- =====================================================

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
DROP POLICY IF EXISTS "order_items_users_own" ON public.order_items;

-- Single SELECT policy (own order items OR admin)
CREATE POLICY "order_items_select" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- Admin-only modification policies
CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "order_items_update" ON public.order_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

CREATE POLICY "order_items_delete" ON public.order_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- =====================================================
-- Fix PROFILES - Combine admin + user own profile
-- =====================================================

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_own" ON public.profiles;

-- Single SELECT policy (own profile OR admin)
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- Admin-only policies for insert/delete
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )
    );

CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that we now have only ONE policy per action per table
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'variants', 'categories', 'orders', 'order_items', 'profiles')
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- Should return 0 rows if all fixed!

-- =====================================================
-- DONE! All "Multiple Permissive Policies" warnings fixed
-- =====================================================
