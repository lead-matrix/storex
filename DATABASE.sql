-- ============================================================
--  LMXEngine · DINA COSMETIC · ULTIMATE DEPLOYMENT SCHEMA
--  https://leadmatrix.io · dinacosmetic.store
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS & HELPERS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Helper to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  full_name  text,
  avatar_url text,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images      text[] NOT NULL DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_active   boolean NOT NULL DEFAULT true,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email          text,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  fulfillment_status      text NOT NULL DEFAULT 'unfulfilled'
                            CHECK (fulfillment_status IN ('unfulfilled','fulfilled')),
  amount_total            numeric(10,2) NOT NULL CHECK (amount_total >= 0),
  currency                text NOT NULL DEFAULT 'usd',
  stripe_session_id       text UNIQUE,
  shipping_address        jsonb,
  tracking_number         text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity   integer NOT NULL CHECK (quantity > 0),
  price      numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- CMS & SETTINGS TABLES
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.frontend_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key  text UNIQUE NOT NULL,
  content_type text NOT NULL, -- 'hero', 'about', 'announcement'
  content_data jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- ATOMIC ORDER TRANSACTION (RPC)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_order_atomic(
  p_stripe_session_id text,
  p_customer_email text,
  p_amount_total bigint,
  p_currency text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_items_json jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
BEGIN
  -- 1. Idempotency Check
  IF EXISTS (SELECT 1 FROM orders WHERE stripe_session_id = p_stripe_session_id) THEN
    RETURN;
  END IF;

  -- 2. Extract Items from Metadata
  v_items_json := (p_metadata->>'items')::jsonb;

  -- 3. Create Main Order
  INSERT INTO orders (stripe_session_id, customer_email, amount_total, currency, status)
  VALUES (p_stripe_session_id, p_customer_email, p_amount_total / 100.0, p_currency, 'paid')
  RETURNING id INTO v_order_id;

  -- 4. Process Each Item & Lock Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_json)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    SELECT stock INTO v_stock FROM products WHERE id = v_product_id FOR UPDATE;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;

    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product_id, v_quantity, (v_item->>'price')::numeric);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- SECURE RLS POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_content ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage all profiles." ON public.profiles FOR ALL USING (is_admin());

-- Products
CREATE POLICY "Anyone can view active products." ON public.products FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins manage products." ON public.products FOR ALL USING (is_admin());

-- Content & Settings
CREATE POLICY "Anyone can view site content." ON public.frontend_content FOR SELECT USING (true);
CREATE POLICY "Admins manage site content." ON public.frontend_content FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view site settings." ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings." ON public.site_settings FOR ALL USING (is_admin());

-- Orders
CREATE POLICY "Users view own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage all orders." ON public.orders FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────
-- DB TRIGGERS
-- ─────────────────────────────────────────────
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER frontend_content_updated_at BEFORE UPDATE ON public.frontend_content FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Sync Trigger for Auth -> Profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- SEED DATA (Minimal)
-- ─────────────────────────────────────────────
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('store_info', '{"name": "DINA COSMETIC", "tagline": "Luxury Obsidian Skincare"}')
ON CONFLICT DO NOTHING;

INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES ('hero_main', 'hero', '{"title": "The Essence of Luxury", "subtitle": "Discover the obsidian collection"}')
ON CONFLICT DO NOTHING;
