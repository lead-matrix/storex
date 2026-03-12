-- ================================================================
--  DINA COSMETIC  ·  DATABASE RESET & CLEANUP  ·  v2.2
--  WARNING: This script drops ALL data. Run BEFORE MASTER.sql.
--  Safe to run even on a completely empty/fresh database.
-- ================================================================
-- ─── §1  DROP TRIGGERS (wrapped in DO blocks so they don't fail
--          when the parent table doesn't exist yet)
-- ───────────────────────────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth'
        AND table_name = 'users'
) THEN DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'product_variants'
) THEN DROP TRIGGER IF EXISTS tr_sync_product_stock ON public.product_variants;
DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
) THEN DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'products'
) THEN DROP TRIGGER IF EXISTS products_updated_at ON public.products;
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'orders'
) THEN DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
END IF;
END $$;
-- ─── §2  DROP VIEWS
-- ───────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_sales_stats CASCADE;
-- ─── §3  DROP FUNCTIONS (CASCADE drops any dependent triggers)
-- ───────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, bigint, text, jsonb, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, uuid, bigint, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.process_order_atomic(text, text, bigint, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.sync_product_stock() CASCADE;
-- ─── §4  DROP TABLES
--          Order: deepest dependents first, then parents.
--          CASCADE handles any remaining FK references automatically.
-- ───────────────────────────────────────────────────────────────
-- CMS
DROP TABLE IF EXISTS public.cms_sections CASCADE;
DROP TABLE IF EXISTS public.cms_pages CASCADE;
-- Orders & Commerce
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.inventory_reservations CASCADE;
DROP TABLE IF EXISTS public.stripe_events CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
-- Products
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
-- Users
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- CMS / Config
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.frontend_content CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.navigation_menus CASCADE;
DROP TABLE IF EXISTS public.theme_settings CASCADE;
-- ─── §5  DROP LEGACY TABLES (may or may not exist from old schemas)
-- ───────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.builder_pages CASCADE;
DROP TABLE IF EXISTS public.variants CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.sensitive_table CASCADE;
-- ─── §6  OPTIONAL: Reset Storage Bucket metadata
--          Uncomment if you want to remove the bucket record too.
--          Note: this does NOT delete the actual files in storage.
-- ───────────────────────────────────────────────────────────────
-- DELETE FROM storage.buckets WHERE id = 'product-images';
-- ================================================================
--  END OF RESET — Database is now clean.
--  Run MASTER.sql next to rebuild the entire system from scratch.
-- ================================================================