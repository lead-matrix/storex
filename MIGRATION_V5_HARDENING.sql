-- ============================================================
--  LMXEngine · DINA COSMETIC · SECURITY HARDENING (V5)
--  Production Launch Preparation
-- ============================================================

-- 1. ENSURE RLS ENABLED ON ALL PUBLIC TABLES
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- 2. HARDEN profiles TABLE
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 3. HARDEN orders TABLE
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;

CREATE POLICY "orders_select"
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "orders_update"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "orders_delete"
ON public.orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 4. HARDEN products TABLE (is_active column check)
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select"
ON public.products
FOR SELECT
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_insert"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_update"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "products_delete"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 5. STRIPE IDEMPOTENCY PROTECTION
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

-- Ensure RLS is on and NO policies exist (Service Role only access)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stripe_events_select" ON public.stripe_events;
DROP POLICY IF EXISTS "stripe_events_insert" ON public.stripe_events;
DROP POLICY IF EXISTS "stripe_events_update" ON public.stripe_events;
DROP POLICY IF EXISTS "stripe_events_delete" ON public.stripe_events;

-- 6. ADD SAFETY CONSTRAINTS
-- Ensure stripe_session_id exists before applying unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='stripe_session_id') THEN
        ALTER TABLE public.orders ADD COLUMN stripe_session_id text;
    END IF;
END $$;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_stripe_session_unique;
ALTER TABLE public.orders ADD CONSTRAINT orders_stripe_session_unique UNIQUE (stripe_session_id);

-- 7. FINAL VERIFICATION QUERY (Information only)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
