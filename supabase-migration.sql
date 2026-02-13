-- Refined Setup for The Obsidian Palace (DINA COSMETIC)

-- 1. Profiles with RBAC
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL,
  images TEXT[] DEFAULT '{}',
  media_3d_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Variants
CREATE TABLE IF NOT EXISTS public.variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_override NUMERIC,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  shipping_amount NUMERIC DEFAULT 0,
  stripe_checkout_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. Seed Products
INSERT INTO public.products (id, name, description, base_price, images, media_3d_url, metadata, created_at, category, is_featured)
VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Foundation', 'Long-lasting liquid foundation for a flawless finish.', 22.00, '{}', NULL, '{}', '2024-05-20 08:30:00+00', 'FACE', true),
('550e8400-e29b-41d4-a716-446655440002', 'Compact Powder', 'Silky smooth compact powder for touch-ups on the go.', 20.00, '{}', NULL, '{}', '2024-05-20 08:35:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440003', 'Face Powder', 'Lightweight loose powder to set your makeup naturally.', 20.00, '{}', NULL, '{}', '2024-05-20 08:40:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440004', 'Setting Powder', 'Translucent powder designed to lock in foundation and concealer.', 15.00, '{}', NULL, '{}', '2024-05-20 08:45:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440005', 'Setting Spray', 'Weightless spray to keep your look fresh for up to 16 hours.', 16.00, '{}', NULL, '{}', '2024-05-20 08:50:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440006', 'Face Primer', 'Smooths skin texture and minimizes the appearance of pores.', 15.00, '{}', NULL, '{}', '2024-05-20 08:55:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440007', 'Concealer', 'High-coverage concealer to hide blemishes and dark circles.', 10.00, '{}', NULL, '{}', '2024-05-20 09:00:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440008', '3-in-1 Blush', 'Versatile tint for a natural flush on cheeks, lips, and eyes.', 0.00, '{}', NULL, '{}', '2024-05-20 09:05:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440009', 'Contour Stick', 'Dual-ended stick for easy sculpting and highlighting.', 12.99, '{}', NULL, '{}', '2024-05-20 09:10:00+00', 'FACE', false),
('550e8400-e29b-41d4-a716-446655440010', 'Eyeshadow Palette', 'A curated selection of matte and shimmer shades for every look.', 25.00, '{}', NULL, '{}', '2024-05-20 09:15:00+00', 'EYES', true),
('550e8400-e29b-41d4-a716-446655440011', 'Eyeshadow Primer', 'Preps lids for vibrant color payoff and zero creasing.', 8.00, '{}', NULL, '{}', '2024-05-20 09:20:00+00', 'EYES', false),
('550e8400-e29b-41d4-a716-446655440012', 'Mascara', 'Volumizing formula that defines and elongates every lash.', 10.00, '{}', NULL, '{}', '2024-05-20 09:25:00+00', 'EYES', false),
('550e8400-e29b-41d4-a716-446655440013', 'Eyeliner', 'Precision liquid liner for sharp wings and bold definition.', 0.00, '{}', NULL, '{}', '2024-05-20 09:30:00+00', 'EYES', false),
('550e8400-e29b-41d4-a716-446655440014', 'Eyebrow Pencil', 'Ultra-fine tip to mimic natural brow hairs.', 6.00, '{}', NULL, '{}', '2024-05-20 09:35:00+00', 'EYES', false),
('550e8400-e29b-41d4-a716-446655440015', 'Matte Lipstick', 'Highly pigmented matte color with a comfortable velvet finish.', 12.00, '{}', NULL, '{}', '2024-05-20 09:40:00+00', 'LIPS', true),
('550e8400-e29b-41d4-a716-446655440016', 'Lip Gloss', 'Non-sticky high-shine gloss for a fuller-looking pout.', 0.00, '{}', NULL, '{}', '2024-05-20 09:45:00+00', 'LIPS', false),
('550e8400-e29b-41d4-a716-446655440017', 'Lip Tint', 'Sheer and long-wearing tint for a just-bitten look.', 0.00, '{}', NULL, '{}', '2024-05-20 09:50:00+00', 'LIPS', false),
('550e8400-e29b-41d4-a716-446655440018', '2-in-1 Lipstick', 'Convenient dual-shade lipstick for ombre or custom effects.', 16.00, '{}', NULL, '{}', '2024-05-20 09:55:00+00', 'LIPS', false),
('550e8400-e29b-41d4-a716-446655440019', 'Makeup Remover', 'Gentle oil-free formula to remove even waterproof makeup.', 12.00, '{}', NULL, '{}', '2024-05-20 10:00:00+00', 'TOOLS', false),
('550e8400-e29b-41d4-a716-446655440020', 'Brush Set 18pcs', 'Professional-grade collection covering all application needs.', 20.00, '{}', NULL, '{}', '2024-05-20 10:05:00+00', 'TOOLS', true),
('550e8400-e29b-41d4-a716-446655440021', 'Brush Set 14pcs', 'Essential brush kit for everyday makeup routines.', 15.00, '{}', NULL, '{}', '2024-05-20 10:10:00+00', 'TOOLS', false)
ON CONFLICT (id) DO NOTHING;

-- 8. RPCs for Stock Management
CREATE OR REPLACE FUNCTION decrement_variant_stock(v_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity - amount
  WHERE id = v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Note: Products might not have direct stock if they are just containers for variants,
  -- but we'll implement this for products that don't use the variants system.
  -- You might need a stock_quantity column on products if you want to use this.
  -- For now, we'll try to find a stock field or skip if it doesn't exist.
  -- Adding a stock_quantity column to products if it doesn't exist:
  UPDATE public.products
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb), 
    '{stock_quantity}', 
    (COALESCE((metadata->>'stock_quantity')::int, 0) - amount)::text::jsonb
  )
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Product Policies
CREATE POLICY "Public read access for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full access for products" ON public.products FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Variant Policies
CREATE POLICY "Public read access for variants" ON public.variants FOR SELECT USING (true);
CREATE POLICY "Admin full access for variants" ON public.variants FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Order Policies
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- Profile Policies
CREATE POLICY "Users view/edit own profile" ON public.profiles FOR ALL 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 10. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();