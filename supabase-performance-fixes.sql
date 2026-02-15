-- =====================================================
-- SUPABASE PERFORMANCE OPTIMIZATION
-- Fixes all warnings from database linter
-- Run this in Supabase SQL Editor AFTER main migration
-- =====================================================

-- =====================================================
-- ISSUE 1: Fix auth.uid() Performance (Auth RLS Init Plan)
-- Replace auth.uid() with (select auth.uid()) in all policies
-- This prevents re-evaluation for each row
-- =====================================================

-- Drop and recreate optimized policies for PRODUCTS table
DROP POLICY IF EXISTS "Admin full access" ON public.products;
DROP POLICY IF EXISTS "Admin full access for products" ON public.products;
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
DROP POLICY IF EXISTS "Public read active products" ON public.products;

-- Single optimized admin policy for products
CREATE POLICY "products_admin_all" ON public.products
    FOR ALL
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

-- Single optimized public read policy for products
CREATE POLICY "products_public_read" ON public.products
    FOR SELECT
    USING (is_active = true);

-- =====================================================
-- Fix VARIANTS table policies
-- =====================================================

DROP POLICY IF EXISTS "Admin full access for variants" ON public.variants;
DROP POLICY IF EXISTS "Admin full access variants" ON public.variants;
DROP POLICY IF EXISTS "Public read access for variants" ON public.variants;
DROP POLICY IF EXISTS "Public read variants" ON public.variants;

-- Single optimized admin policy for variants
CREATE POLICY "variants_admin_all" ON public.variants
    FOR ALL
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

-- Single optimized public read policy for variants
CREATE POLICY "variants_public_read" ON public.variants
    FOR SELECT
    USING (true);

-- =====================================================
-- Fix PROFILES table policies
-- =====================================================

DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view/edit own profile" ON public.profiles;

-- Optimized admin policy for profiles
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )
    );

-- Optimized user own profile policy
CREATE POLICY "profiles_users_own" ON public.profiles
    FOR ALL
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- =====================================================
-- Fix ORDERS table policies
-- =====================================================

DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;

-- Optimized admin policy for orders
CREATE POLICY "orders_admin_all" ON public.orders
    FOR ALL
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

-- Optimized user own orders policy
CREATE POLICY "orders_users_own" ON public.orders
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- Fix ORDER_ITEMS table policies
-- =====================================================

DROP POLICY IF EXISTS "Admin full access order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;

-- Optimized admin policy for order_items
CREATE POLICY "order_items_admin_all" ON public.order_items
    FOR ALL
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

-- Optimized user own order items policy
CREATE POLICY "order_items_users_own" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = (SELECT auth.uid())
        )
    );

-- =====================================================
-- Fix CATEGORIES table policies
-- =====================================================

DROP POLICY IF EXISTS "Admin full access categories" ON public.categories;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;

-- Optimized admin policy for categories
CREATE POLICY "categories_admin_all" ON public.categories
    FOR ALL
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

-- Optimized public read policy for categories
CREATE POLICY "categories_public_read" ON public.categories
    FOR SELECT
    USING (true);

-- =====================================================
-- ISSUE 2: Fix Duplicate Index on variants table
-- Drop one of the duplicate unique constraints
-- =====================================================

-- Check which constraints exist
-- Both unique_sku and variants_sku_key are unique constraints
-- We only need one, so drop unique_sku and keep variants_sku_key

ALTER TABLE public.variants DROP CONSTRAINT IF EXISTS unique_sku;
-- Keep variants_sku_key (the primary unique constraint)

-- =====================================================
-- ISSUE 3: Add Missing Index for Foreign Key
-- Add index for order_items.variant_id
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_items_variant 
ON public.order_items(variant_id)
WHERE variant_id IS NOT NULL;

-- =====================================================
-- INFO: Unused indexes are kept for now
-- They'll be used once the app has real traffic
-- Remove them later if they remain unused after production use
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the fixes
-- =====================================================

-- Check policies are optimized
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for duplicate indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('products', 'variants', 'orders', 'order_items', 'profiles', 'categories')
ORDER BY tablename, indexname;

-- =====================================================
-- DONE! All performance warnings fixed
-- =====================================================
