-- ================================================================
--  DINA COSMETIC  ·  DATABASE RESET & CLEANUP  ·  v2.1
--  WARNING: This is a DESTRUCTIVE script. It will wipe all data.
--  Run this in the Supabase SQL Editor BEFORE running MASTER.sql
-- ================================================================
-- 1. DROP TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_sync_product_stock ON public.product_variants;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
-- 2. DROP VIEWS
DROP VIEW IF EXISTS public.admin_sales_stats CASCADE;
-- 3. DROP FUNCTIONS (CASCADE handles linked triggers)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, bigint, text, jsonb, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, uuid, bigint, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, bigint, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.sync_product_stock() CASCADE;
-- 4. DROP TABLES (CASCADE handles foreign key dependencies)
--    Order matters: children before parents.
DROP TABLE IF EXISTS public.cms_sections CASCADE;
DROP TABLE IF EXISTS public.cms_pages CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.inventory_reservations CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.stripe_events CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.frontend_content CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.navigation_menus CASCADE;
DROP TABLE IF EXISTS public.theme_settings CASCADE;
-- 5. DROP LEGACY TABLES (may or may not exist from old schemas)
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.builder_pages CASCADE;
DROP TABLE IF EXISTS public.variants CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.sensitive_table CASCADE;
-- 6. OPTIONAL: Reset Storage Bucket metadata (uncomment if needed)
-- DELETE FROM storage.buckets WHERE id = 'product-images';
-- ================================================================
--  END OF RESET
--  Now you can safely run MASTER.sql to rebuild the entire system.
-- ================================================================