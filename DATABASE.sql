-- ============================================================
--  LMXEngine · DINA COSMETIC
--  Complete Database Setup — run once on a fresh Supabase project
--  https://github.com/lead-matrix/LMXEngine
-- ============================================================
-- HOW TO USE:
--   1. Create a new Supabase project
--   2. Open SQL Editor → paste this entire file → RUN
--   3. Copy the Supabase URL + anon key + service role key into .env.local
--   4. Set one user's role to 'admin' (see bottom of this file)
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- HELPER – reusable admin check (used in RLS policies)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────
-- HELPER – auto-update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- HELPER – auto-create profile on signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════
-- TABLE: profiles
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  full_name  text,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════
-- TABLE: products
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  base_price  numeric(10,2) NOT NULL CHECK (base_price >= 0),
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images      text[] NOT NULL DEFAULT '{}',
  category    text,
  is_featured boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx    ON public.products(category);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS products_created_at_idx  ON public.products(created_at DESC);

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: variants
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           text NOT NULL,
  sku            text,
  price_override numeric(10,2) CHECK (price_override >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS variants_product_id_idx ON public.variants(product_id);

DROP TRIGGER IF EXISTS variants_updated_at ON public.variants;
CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON public.variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: orders
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.orders (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  total_amount            numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount              numeric(10,2) NOT NULL DEFAULT 0,
  shipping_amount         numeric(10,2) NOT NULL DEFAULT 0,
  stripe_checkout_id      text,
  stripe_payment_intent_id text,
  shipping_address        jsonb,
  tracking_number         text,
  shipping_label_url      text,
  metadata                jsonb NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: order_items
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.variants(id) ON DELETE SET NULL,
  quantity   integer NOT NULL CHECK (quantity > 0),
  price      numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);

-- ═══════════════════════════════════════════════
-- TABLE: system_settings  (store kill-switch & config)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.system_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  value       jsonb NOT NULL DEFAULT 'true',
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: site_settings  (store info, contact, social, footer)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: frontend_content  (hero, banners, sections)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.frontend_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key  text UNIQUE NOT NULL,
  content_type text NOT NULL DEFAULT 'section',
  content_data jsonb NOT NULL DEFAULT '{}',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS frontend_content_updated_at ON public.frontend_content;
CREATE TRIGGER frontend_content_updated_at
  BEFORE UPDATE ON public.frontend_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: navigation_menus
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key      text UNIQUE NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  menu_items    jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS navigation_menus_updated_at ON public.navigation_menus;
CREATE TRIGGER navigation_menus_updated_at
  BEFORE UPDATE ON public.navigation_menus
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: pages  (CMS pages)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  content      jsonb NOT NULL DEFAULT '{}',
  meta_title   text,
  meta_desc    text,
  is_published boolean NOT NULL DEFAULT true,
  is_homepage  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pages_slug_idx ON public.pages(slug);

DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: theme_settings
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key  text UNIQUE NOT NULL,
  is_active  boolean NOT NULL DEFAULT false,
  colors     jsonb NOT NULL DEFAULT '{}',
  fonts      jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════
-- TABLE: admin_audit_logs
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  table_name text,
  record_id  uuid,
  old_data   jsonb,
  new_data   jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx   ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- STORED FUNCTIONS (called from stripe webhook)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(v_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = GREATEST(0, stock_quantity - amount)
  WHERE id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - amount)
  WHERE id = p_id;
END;
$$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY – enable on all tables
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- RLS POLICIES: profiles
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin"   ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: products
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "products_public_read"  ON public.products;
DROP POLICY IF EXISTS "products_admin_write"  ON public.products;

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: variants
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "variants_public_read" ON public.variants;
DROP POLICY IF EXISTS "variants_admin_write" ON public.variants;

CREATE POLICY "variants_public_read" ON public.variants
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "variants_admin_write" ON public.variants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: orders
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_user_select"  ON public.orders;
DROP POLICY IF EXISTS "orders_user_insert"  ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all"    ON public.orders;

CREATE POLICY "orders_user_select" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "orders_user_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: order_items
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "order_items_user_select"  ON public.order_items;
DROP POLICY IF EXISTS "order_items_user_insert"  ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_all"    ON public.order_items;

CREATE POLICY "order_items_user_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

CREATE POLICY "order_items_user_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: system_settings
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "system_settings_public_read"  ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_admin_write"  ON public.system_settings;

CREATE POLICY "system_settings_public_read" ON public.system_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: site_settings
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_write" ON public.site_settings;

CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_settings_admin_write" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: frontend_content
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "frontend_content_public_read" ON public.frontend_content;
DROP POLICY IF EXISTS "frontend_content_admin_write" ON public.frontend_content;

CREATE POLICY "frontend_content_public_read" ON public.frontend_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "frontend_content_admin_write" ON public.frontend_content
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: navigation_menus
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "navigation_menus_public_read" ON public.navigation_menus;
DROP POLICY IF EXISTS "navigation_menus_admin_write" ON public.navigation_menus;

CREATE POLICY "navigation_menus_public_read" ON public.navigation_menus
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "navigation_menus_admin_write" ON public.navigation_menus
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: pages
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "pages_public_read"  ON public.pages;
DROP POLICY IF EXISTS "pages_admin_write"  ON public.pages;

CREATE POLICY "pages_public_read" ON public.pages
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE POLICY "pages_admin_write" ON public.pages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: theme_settings
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "theme_settings_public_read" ON public.theme_settings;
DROP POLICY IF EXISTS "theme_settings_admin_write" ON public.theme_settings;

CREATE POLICY "theme_settings_public_read" ON public.theme_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "theme_settings_admin_write" ON public.theme_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────
-- RLS POLICIES: admin_audit_logs
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.admin_audit_logs;

CREATE POLICY "audit_logs_admin_read" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

-- ─────────────────────────────────────────────
-- STORAGE: product-images bucket
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "storage_product_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_admin_delete" ON storage.objects;

CREATE POLICY "storage_product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "storage_product_images_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "storage_product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "storage_product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────

-- Store kill-switch (true = store open)
INSERT INTO public.system_settings (key, value, description)
VALUES ('store_enabled', 'true', 'Set to false to put the store into maintenance mode.')
ON CONFLICT (key) DO NOTHING;

-- Default site settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES
  ('store_info',   '{"name":"DINA COSMETIC","tagline":"Luxury Redefined","description":"Premium cosmetics for the discerning palette.","logo_url":""}'),
  ('contact_info', '{"email":"hello@dinacosmetic.com","phone":"","address":"","hours":"Mon-Fri 9am-6pm"}'),
  ('social_links', '{"facebook":"","instagram":"","twitter":"","tiktok":"","youtube":""}'),
  ('footer_links', '{"columns":[{"title":"Shop","links":[{"text":"All Products","url":"/shop"}]},{"title":"Company","links":[{"text":"About","url":"/about"},{"text":"Contact","url":"/contact"}]}]}')
ON CONFLICT (setting_key) DO NOTHING;

-- Default frontend content
INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES
  ('hero_main',             'hero',    '{"headline":"The Obsidian Palace","subheadline":"A sanctuary for luxury cosmetics","cta_text":"Shop Now","cta_url":"/shop"}'),
  ('banner_top',            'banner',  '{"text":"Free shipping on orders over $150","active":true}'),
  ('homepage_collections',  'section', '{"title":"Our Collections","subtitle":"Curated luxury for every ritual"}')
ON CONFLICT (content_key) DO NOTHING;

-- Default navigation
INSERT INTO public.navigation_menus (menu_key, display_order, menu_items)
VALUES
  ('main_nav',   0, '[{"label":"Shop","url":"/shop"},{"label":"Collections","url":"/collections"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"}]'),
  ('footer_nav', 1, '[{"label":"Privacy","url":"/privacy"},{"label":"Terms","url":"/terms"}]')
ON CONFLICT (menu_key) DO NOTHING;

-- Default pages
INSERT INTO public.pages (slug, title, content, is_homepage)
VALUES
  ('home',       'Home',       '{"hero":{"headline":"The Obsidian Palace","subheadline":"Luxury Cosmetics"}}', true),
  ('about',      'About',      '{"body":"Our story..."}',             false),
  ('contact',    'Contact',    '{"body":"Get in touch with us."}',    false),
  ('the-palace', 'The Palace', '{"body":"Welcome to The Palace."}',   false)
ON CONFLICT (slug) DO NOTHING;

-- Default theme
INSERT INTO public.theme_settings (theme_key, is_active, colors, fonts)
VALUES ('obsidian_palace', true,
  '{"background":"#111111","gold":"#D4AF37","white":"#FFFFFF"}',
  '{"heading":"Playfair Display","body":"Inter"}')
ON CONFLICT (theme_key) DO NOTHING;

-- ─────────────────────────────────────────────
-- MAKE YOURSELF AN ADMIN
-- Run this AFTER you have signed up via the app:
-- ─────────────────────────────────────────────
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin@email.com';
