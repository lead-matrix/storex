-- ============================================================
--  LMXEngine · DINA COSMETIC · RLS PERFORMANCE OPTIMIZATION
--  Fixes "auth_rls_initplan" warnings by wrapping auth.uid()
--  This prevents re-evaluation of auth functions per row.
-- ============================================================

-- 1. PROFILES OPTIMIZATION
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

-- 2. ORDERS OPTIMIZATION
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;

CREATE POLICY "orders_select" ON public.orders FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "orders_update" ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "orders_delete" ON public.orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

-- 3. PRODUCTS OPTIMIZATION
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_insert" ON public.products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_update" ON public.products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_delete" ON public.products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

-- 4. VARIANTS OPTIMIZATION (Just in case)
DROP POLICY IF EXISTS "variants_select" ON public.variants;
DROP POLICY IF EXISTS "variants_insert" ON public.variants;
DROP POLICY IF EXISTS "variants_update" ON public.variants;
DROP POLICY IF EXISTS "variants_delete" ON public.variants;

CREATE POLICY "variants_select" ON public.variants FOR SELECT
USING (true);

CREATE POLICY "variants_insert" ON public.variants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "variants_update" ON public.variants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "variants_delete" ON public.variants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

-- 5. CATEGORIES OPTIMIZATION
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT
USING (true);

CREATE POLICY "categories_insert" ON public.categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "categories_update" ON public.categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);

CREATE POLICY "categories_delete" ON public.categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
    AND p.role = 'admin'
  )
);
