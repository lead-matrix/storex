-- =====================================================
-- COMPLETE DATABASE SETUP - OPTIMIZED VERSION
-- Fixes performance warnings and permissive policies
-- =====================================================

-- =====================================================
-- PART 1: FIX SIGNUP (PROFILES AUTO-CREATE)
-- =====================================================

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_users_own" ON profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Optimized Policies for Profiles (Combined and Performance-tuned)

-- 1. SELECT: Public can view profiles (needed for various lookups), or at least authenticated users.
-- We use (select auth.uid()) to avoid re-evaluation.
CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 2. INSERT: Users can insert their own profile OR Admins can insert any.
-- Combined into one policy to avoid "multiple permissive policies" warning.
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (id = (select auth.uid())) 
    OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    ))
  );

-- 3. UPDATE: Users can update their own profile OR Admins can update any.
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (id = (select auth.uid())) 
    OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    ))
  )
  WITH CHECK (
    (id = (select auth.uid())) 
    OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    ))
  );

-- 4. DELETE: Only admins can delete profiles, or users can delete their own.
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  TO authenticated
  USING (
    (id = (select auth.uid())) 
    OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    ))
  );

-- Drop existing triggers (all possible names)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Drop function with CASCADE to remove dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create auto-profile function with SEARCH_PATH set for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 2: SITE SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can modify settings" ON site_settings;
DROP POLICY IF EXISTS "site_settings_read" ON site_settings;
DROP POLICY IF EXISTS "site_settings_write" ON site_settings;
DROP POLICY IF EXISTS "site_settings_admin_policy" ON site_settings;

-- Optimized Policies for Site Settings

-- 1. SELECT: Public and Admins can read (Combined)
CREATE POLICY "site_settings_select_policy" ON site_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 2. INSERT, UPDATE, DELETE: Only admins
-- Note: SELECT is handled separately by site_settings_select_policy.
CREATE POLICY "site_settings_insert_policy" ON site_settings
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "site_settings_update_policy" ON site_settings
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "site_settings_delete_policy" ON site_settings
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('store_info', '{
  "name": "DINA COSMETIC",
  "tagline": "The Obsidian Palace",
  "description": "Luxury Beauty & Cosmetics",
  "logo_url": "/logo.jpg"
}'::jsonb),
('contact_info', '{
  "email": "concierge@dinacosmetic.store",
  "phone": "+1 (800) 123-4567",
  "address": "123 Obsidian Avenue, Suite 100",
  "hours": "Monday - Friday: 9:00 AM - 6:00 PM EST"
}'::jsonb),
('social_links', '{
  "facebook": "https://facebook.com/dinacosmetic",
  "instagram": "https://instagram.com/dinacosmetic",
  "twitter": "https://twitter.com/dinacosmetic",
  "tiktok": "https://tiktok.com/@dinacosmetic",
  "youtube": "https://youtube.com/@dinacosmetic"
}'::jsonb),
('footer_links', '{
  "columns": [
    {
      "title": "THE COLLECTION",
      "links": [
        {"text": "All Products", "url": "/shop"},
        {"text": "New Arrivals", "url": "/shop?filter=new"},
        {"text": "Best Sellers", "url": "/shop?filter=bestsellers"},
        {"text": "Gift Sets", "url": "/shop?category=gifts"}
      ]
    },
    {
      "title": "THE PALACE",
      "links": [
        {"text": "Our Story", "url": "/about"},
        {"text": "Boutique Experience", "url": "/boutique"},
        {"text": "Contact Us", "url": "/contact"},
        {"text": "Careers", "url": "/careers"}
      ]
    },
    {
      "title": "CUSTOMER CARE",
      "links": [
        {"text": "Shipping & Returns", "url": "/shipping"},
        {"text": "Privacy Policy", "url": "/privacy"},
        {"text": "Terms of Service", "url": "/terms"},
        {"text": "FAQ", "url": "/faq"}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create update trigger for settings with SEARCH_PATH set for security
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 3: SECURITY FIXES (MANUAL INSTRUCTIONS)
-- =====================================================

-- The following functions have been fixed in this script:
-- 1. handle_new_user()
-- 2. update_updated_at_column()

-- If you still see "mutable search_path" warnings for other functions,
-- run these commands in your Supabase SQL Editor (adjust arguments if needed):

-- ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
-- ALTER FUNCTION public.decrement_variant_stock(uuid, int) SET search_path = public;
-- ALTER FUNCTION public.update_product_image_from_storage() SET search_path = public;
-- ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- =====================================================
-- PART 4: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT SELECT ON public.site_settings TO anon;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check profiles table
SELECT 'Profiles table' as item, 
       CASE WHEN (SELECT count(*) FROM information_schema.tables WHERE table_name = 'profiles') > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check site_settings table
SELECT 'Site settings table' as item,
       CASE WHEN (SELECT count(*) FROM information_schema.tables WHERE table_name = 'site_settings') > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check trigger
SELECT 'Signup trigger' as item,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.triggers 
           WHERE event_object_table = 'users' 
           AND event_object_schema = 'auth' 
           AND action_statement LIKE '%handle_new_user%'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check policies on profiles
SELECT 'Profiles policies' as item,
       (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') || ' policies' as status;

-- Check policies on site_settings
SELECT 'Settings policies' as item,
       (SELECT count(*) FROM pg_policies WHERE tablename = 'site_settings') || ' policies' as status;

-- =====================================================
-- DONE! 
-- =====================================================
