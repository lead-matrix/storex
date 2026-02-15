-- =====================================================
-- FIX SIGNUP - AUTO-CREATE PROFILE ON USER REGISTRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, ensure profiles table exists with correct structure
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_users_own" ON profiles;

-- Create new optimized policies
-- 1. Anyone can read profiles (for admin user management)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (true);

-- 2. Users can insert their own profile (needed for signup)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Admins can do everything
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- AUTO-CREATE PROFILE TRIGGER
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Check policies
SELECT 
  policyname, 
  tablename, 
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- DONE! Users can now sign up successfully
-- =====================================================

-- Test by creating a new user in your app!
