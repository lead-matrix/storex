-- ============================================================
--  DINA COSMETIC · CMS FULL CONTROL EXPANSION
--  Run AFTER MASTER.sql — fully idempotent, no conflicts.
--
--  Gives admin control over EVERYTHING:
--    § 1  Products: on_sale + sale_price columns
--    § 2  navigation_menus table (header nav, footer nav)
--    § 3  pages table (about, contact, privacy, terms)
--    § 4  theme_settings table (colours, fonts, layout)
--    § 5  Expand frontend_content: ALL homepage sections,
--          brand story, trust indicators, newsletter,
--          collections page, about page, contact page,
--          footer, social links, announcement banner
--    § 6  Expand site_settings: shipping, social, contact info
--    § 7  RLS policies for all new tables
--    § 8  Seed all data (idempotent — ON CONFLICT DO UPDATE)
--    § 9  Verification
-- ============================================================
-- ─────────────────────────────────────────────────────────────
-- § 1. PRODUCTS — SALE CONTROLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS on_sale boolean NOT NULL DEFAULT false;
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sale_price numeric(10, 2) CHECK (
        sale_price IS NULL
        OR sale_price >= 0
    );
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;
-- Indexes for badge/filter queries
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale)
WHERE on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new)
WHERE is_new = true;
-- ─────────────────────────────────────────────────────────────
-- § 2. NAVIGATION MENUS TABLE
--      Admin controls header nav links + footer nav links
--      without touching any code.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.navigation_menus (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_key text UNIQUE NOT NULL,
    -- 'header_main', 'footer_info', 'footer_legal'
    label text NOT NULL,
    menu_items jsonb NOT NULL DEFAULT '[]',
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_menus_select" ON public.navigation_menus;
DROP POLICY IF EXISTS "nav_menus_insert" ON public.navigation_menus;
DROP POLICY IF EXISTS "nav_menus_update" ON public.navigation_menus;
DROP POLICY IF EXISTS "nav_menus_delete" ON public.navigation_menus;
CREATE POLICY "nav_menus_select" ON public.navigation_menus FOR
SELECT USING (true);
CREATE POLICY "nav_menus_insert" ON public.navigation_menus FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "nav_menus_update" ON public.navigation_menus FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "nav_menus_delete" ON public.navigation_menus FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
DROP TRIGGER IF EXISTS nav_menus_updated_at ON public.navigation_menus;
CREATE TRIGGER nav_menus_updated_at BEFORE
UPDATE ON public.navigation_menus FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ─────────────────────────────────────────────────────────────
-- § 3. PAGES TABLE
--      Admin edits About, Contact, Privacy, Terms content
--      from the dashboard — no code deploys needed.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    meta_title text,
    meta_desc text,
    content jsonb NOT NULL DEFAULT '{}',
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_select" ON public.pages;
DROP POLICY IF EXISTS "pages_insert" ON public.pages;
DROP POLICY IF EXISTS "pages_update" ON public.pages;
DROP POLICY IF EXISTS "pages_delete" ON public.pages;
CREATE POLICY "pages_select" ON public.pages FOR
SELECT USING (
        is_published = true
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_insert" ON public.pages FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_update" ON public.pages FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "pages_delete" ON public.pages FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
CREATE TRIGGER pages_updated_at BEFORE
UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
-- ─────────────────────────────────────────────────────────────
-- § 4. THEME SETTINGS TABLE
--      Admin changes brand colours, fonts — live on next load.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_key text UNIQUE NOT NULL,
    label text NOT NULL,
    settings jsonb NOT NULL DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "theme_select" ON public.theme_settings;
DROP POLICY IF EXISTS "theme_insert" ON public.theme_settings;
DROP POLICY IF EXISTS "theme_update" ON public.theme_settings;
DROP POLICY IF EXISTS "theme_delete" ON public.theme_settings;
CREATE POLICY "theme_select" ON public.theme_settings FOR
SELECT USING (true);
CREATE POLICY "theme_insert" ON public.theme_settings FOR
INSERT TO authenticated WITH CHECK (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_update" ON public.theme_settings FOR
UPDATE USING (
        (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "theme_delete" ON public.theme_settings FOR DELETE USING (
    (
        SELECT public.is_admin()
    )
);
DROP TRIGGER IF EXISTS theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER theme_settings_updated_at BEFORE
UPDATE ON public.theme_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ─────────────────────────────────────────────────────────────
-- § 5. FRONTEND CONTENT — ALL SECTIONS
--      Every editable storefront section, seeded with defaults.
--      Admin Updates → instantly reflected on storefront.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.frontend_content (content_key, content_type, content_data)
VALUES -- ── HOMEPAGE ──────────────────────────────────────────────
    -- Hero (full fields — existing row gets updated with complete data)
    (
        'hero_main',
        'hero',
        '{
    "heading": "The Essence of Luxury",
    "subheading": "Discover the Obsidian Collection — where art meets absolute beauty.",
    "cta_text": "Discover Collection",
    "cta_link": "/shop",
    "image_url": "/hero-default.jpg",
    "badge_text": "New Collection 2026"
  }'::jsonb
    ),
    -- Announcement Banner (dismissible top bar)
    (
        'announcement_banner',
        'banner',
        '{
    "text": "Free Shipping on orders over $50",
    "cta_text": "Shop Now",
    "cta_link": "/shop",
    "is_active": true,
    "bg_color": "#D4AF37"
  }'::jsonb
    ),
    -- Featured Products Section
    (
        'featured_section',
        'section',
        '{
    "heading": "The Collection",
    "subheading": "Curated masterpieces for the discerning",
    "cta_text": "View All",
    "cta_link": "/shop",
    "show_badges": true
  }'::jsonb
    ),
    -- Brand Story Section
    (
        'brand_story',
        'section',
        '{
    "heading": "The Essence of Obsidian Masterpiece",
    "subheading": "Born from the pursuit of absolute perfection",
    "body": "DINA COSMETIC was founded not in a laboratory, but in a sanctuary. We believe that true beauty is the illumination of the soul, and our products are merely the vessels to manifest that light.",
    "cta_text": "Discover Our Heritage",
    "cta_link": "/about",
    "image_url": "/story-image.jpg"
  }'::jsonb
    ),
    -- Trust Indicators
    (
        'trust_indicators',
        'section',
        '{
    "items": [
      {
        "icon": "Truck",
        "title": "Complimentary Delivery",
        "description": "On all orders exceeding $50"
      },
      {
        "icon": "RotateCcw",
        "title": "Effortless Returns",
        "description": "30-day elegant exchange protocol"
      },
      {
        "icon": "Award",
        "title": "Authentic Masterpieces",
        "description": "Guaranteed direct from the Palace"
      },
      {
        "icon": "Shield",
        "title": "Secure Encrypted Transport",
        "description": "Uncompromised transaction safety"
      }
    ]
  }'::jsonb
    ),
    -- Newsletter Section
    (
        'newsletter_section',
        'section',
        '{
    "heading": "Join The Obsidian Palace",
    "subheading": "Subscribe to receive exclusive access to new collection launches, private events, and editorial content.",
    "placeholder": "Your Email Address",
    "button_text": "Subscribe",
    "success_text": "Welcome to the Palace"
  }'::jsonb
    ),
    -- Collections Landing
    (
        'collections_page',
        'page',
        '{
    "heading": "The Vaults",
    "subheading": "Curated collections for the dedicated connoisseur"
  }'::jsonb
    ),
    -- ── ABOUT PAGE ────────────────────────────────────────────
    (
        'about_hero',
        'page',
        '{
    "badge": "Our Genesis",
    "heading": "The Obsidian Palace",
    "tagline": "Born from the pursuit of absolute perfection"
  }'::jsonb
    ),
    (
        'about_story_1',
        'page',
        '{
    "heading": "Rituals of Illumination",
    "body": "DINA COSMETIC was founded not in a laboratory, but in a sanctuary. We believe that true beauty is the illumination of the soul, and our products are merely the vessels to manifest that light."
  }'::jsonb
    ),
    (
        'about_story_2',
        'page',
        '{
    "heading": "The Obsidian Standard",
    "body": "Every artifact produced within the Palace undergoes a rigorous alchemy of absolute black minerals and liquid gold accents. This is the Obsidian Standard—a promise of weight, luxury, and unmatched performance."
  }'::jsonb
    ),
    (
        'about_philosophy',
        'page',
        '{
    "items": [
      {"icon": "History",      "title": "Legacy",    "text": "Evolving the timeless secrets of cosmetics into modern artifacts."},
      {"icon": "ShieldCheck",  "title": "Purity",    "text": "Untouched by ordinary standards. Crafted for the absolute."},
      {"icon": "Sparkles",     "title": "Radiance",  "text": "Designed to capture and reflect light in its most premium form."},
      {"icon": "Heart",        "title": "Devotion",  "text": "A singular focus on the enhancement of your natural majesty."}
    ]
  }'::jsonb
    ),
    (
        'about_closing_quote',
        'page',
        '{
    "quote": "Step out of the ordinary and into the sanctuary of your own excellence.",
    "tagline": "The Ritual Awaits"
  }'::jsonb
    ),
    -- ── CONTACT PAGE ──────────────────────────────────────────
    (
        'contact_page',
        'page',
        '{
    "badge": "Client Relations",
    "heading": "Concierge",
    "subheading": "Our dedicated team is available to assist you with any inquiries regarding the Palace collection and your acquisitions.",
    "email": "concierge@dinacosmetic.store",
    "phone": "+1 (800) LUX-DINA",
    "address": "123 Obsidian Tower, Virtual City",
    "form_heading": "Send an Inquiry",
    "form_button": "Dispatch Message"
  }'::jsonb
    ),
    -- ── FOOTER ────────────────────────────────────────────────
    (
        'footer_main',
        'footer',
        '{
    "brand": "DINA COSMETIC",
    "tagline": "The Obsidian Palace · Luxury Redefined",
    "copyright": "© 2026 DINA COSMETIC. All rights reserved.",
    "newsletter_text": "Become part of the Palace"
  }'::jsonb
    ),
    -- Social Links
    (
        'social_links',
        'social',
        '{
    "instagram": "https://instagram.com/dinacosmetic",
    "tiktok": "https://tiktok.com/@dinacosmetic",
    "facebook": "https://facebook.com/dinacosmetic",
    "pinterest": "",
    "youtube": ""
  }'::jsonb
    ),
    -- ── PRIVACY & TERMS ───────────────────────────────────────
    (
        'privacy_page',
        'legal',
        '{
    "heading": "Privacy Policy",
    "last_updated": "2026-03-03",
    "sections": [
      {"title": "Data We Collect", "body": "We collect your name, email, and shipping address when you place an order."},
      {"title": "How We Use Your Data", "body": "Your data is used solely to process orders and send order updates. We never sell your data."},
      {"title": "Cookies", "body": "We use essential cookies to keep you logged in and maintain your cart."},
      {"title": "Contact", "body": "For privacy inquiries, email privacy@dinacosmetic.store"}
    ]
  }'::jsonb
    ),
    (
        'terms_page',
        'legal',
        '{
    "heading": "Terms of Service",
    "last_updated": "2026-03-03",
    "sections": [
      {"title": "Acceptance", "body": "By using this website you agree to these terms."},
      {"title": "Products & Pricing", "body": "All prices are in USD. We reserve the right to change prices at any time."},
      {"title": "Returns", "body": "We accept returns within 30 days of delivery for unopened products."},
      {"title": "Contact", "body": "For legal inquiries, email legal@dinacosmetic.store"}
    ]
  }'::jsonb
    ) ON CONFLICT (content_key) DO
UPDATE
SET content_data = EXCLUDED.content_data,
    updated_at = now();
-- ─────────────────────────────────────────────────────────────
-- § 6. SITE SETTINGS — FULL ADMIN CONTROL
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES -- Store basics (already seeded — wont conflict)
    (
        'store_info',
        '{
    "name": "DINA COSMETIC",
    "tagline": "Luxury Obsidian Skincare",
    "currency": "USD",
    "email": "concierge@dinacosmetic.store",
    "phone": "+1 (800) LUX-DINA",
    "address": "123 Obsidian Tower, Virtual City"
  }'::jsonb
    ),
    -- Shipping rules
    (
        'shipping',
        '{
    "free_threshold": 50,
    "flat_rate": 5.99,
    "free_label": "Free Shipping",
    "carrier": "USPS"
  }'::jsonb
    ),
    -- Social media
    (
        'social_media',
        '{
    "instagram": "https://instagram.com/dinacosmetic",
    "tiktok": "https://tiktok.com/@dinacosmetic",
    "facebook": "https://facebook.com/dinacosmetic",
    "pinterest": "",
    "youtube": ""
  }'::jsonb
    ),
    -- SEO defaults
    (
        'seo_defaults',
        '{
    "site_name": "DINA COSMETIC",
    "title_template": "%s | DINA COSMETIC",
    "default_description": "Luxury obsidian cosmetics — The Obsidian Palace",
    "og_image": "/og-default.jpg",
    "twitter_handle": "@dinacosmetic"
  }'::jsonb
    ),
    -- Promotions / sale banner
    (
        'promotions',
        '{
    "sale_active": false,
    "sale_label": "SALE",
    "sale_badge_color": "#DC2626",
    "bestseller_label": "BESTSELLER",
    "featured_label": "FEATURED",
    "new_label": "NEW"
  }'::jsonb
    ),
    -- Email notifications
    (
        'email_settings',
        '{
    "from_name": "DINA COSMETIC",
    "from_email": "concierge@dinacosmetic.store",
    "reply_to": "concierge@dinacosmetic.store",
    "order_confirmation": true,
    "shipping_notification": true,
    "newsletter_welcome": true
  }'::jsonb
    ),
    -- Kill switch (already seeded)
    ('store_enabled', 'true'::jsonb) ON CONFLICT (setting_key) DO
UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = now();
-- ─────────────────────────────────────────────────────────────
-- § 7. NAVIGATION MENUS — DEFAULT SEED
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.navigation_menus (menu_key, label, display_order, menu_items)
VALUES (
        'header_main',
        'Header Navigation',
        1,
        '[
    {"label": "Shop",        "href": "/shop",        "is_active": true},
    {"label": "Collections", "href": "/collections", "is_active": true},
    {"label": "About",       "href": "/about",       "is_active": true},
    {"label": "Contact",     "href": "/contact",     "is_active": true}
  ]'::jsonb
    ),
    (
        'footer_shop',
        'Footer — Shop Links',
        2,
        '[
    {"label": "All Products",  "href": "/shop"},
    {"label": "Face",          "href": "/collections/face"},
    {"label": "Eyes",          "href": "/collections/eyes"},
    {"label": "Lips",          "href": "/collections/lips"},
    {"label": "Tools",         "href": "/collections/tools"}
  ]'::jsonb
    ),
    (
        'footer_legal',
        'Footer — Legal Links',
        3,
        '[
    {"label": "Privacy Policy", "href": "/privacy"},
    {"label": "Terms of Service","href": "/terms"},
    {"label": "Contact",        "href": "/contact"}
  ]'::jsonb
    ) ON CONFLICT (menu_key) DO
UPDATE
SET menu_items = EXCLUDED.menu_items,
    updated_at = now();
-- ─────────────────────────────────────────────────────────────
-- § 8. PAGES TABLE — DEFAULT SEED
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.pages (
        slug,
        title,
        meta_title,
        meta_desc,
        content,
        is_published
    )
VALUES (
        'about',
        'About Us',
        'The Palace | DINA COSMETIC',
        'The story and philosophy of the Obsidian Palace.',
        '{
     "hero": {"badge": "Our Genesis", "heading": "The Obsidian Palace"},
     "story": [
       {"heading": "Rituals of Illumination", "body": "DINA COSMETIC was founded not in a laboratory, but in a sanctuary. We believe that true beauty is the illumination of the soul."},
       {"heading": "The Obsidian Standard",   "body": "Every artifact produced within the Palace undergoes a rigorous alchemy of absolute black minerals and liquid gold accents."}
     ],
     "closing_quote": "Step out of the ordinary and into the sanctuary of your own excellence."
   }'::jsonb,
        true
    ),
    (
        'contact',
        'Concierge',
        'Concierge | DINA COSMETIC',
        'Contact the Obsidian Palace for inquiries and luxury support.',
        '{
     "heading": "Concierge",
     "subheading": "Our dedicated team is available to assist you.",
     "email": "concierge@dinacosmetic.store",
     "phone": "+1 (800) LUX-DINA",
     "address": "123 Obsidian Tower, Virtual City"
   }'::jsonb,
        true
    ),
    (
        'privacy',
        'Privacy Policy',
        'Privacy Policy | DINA COSMETIC',
        'How DINA COSMETIC handles your data.',
        '{
     "heading": "Privacy Policy",
     "last_updated": "2026-03-03",
     "sections": [
       {"title": "Data We Collect", "body": "We collect your name, email, and shipping address when you place an order."},
       {"title": "How We Use It",   "body": "Your data is used solely to process orders. We never sell your data."},
       {"title": "Contact",         "body": "Email: privacy@dinacosmetic.store"}
     ]
   }'::jsonb,
        true
    ),
    (
        'terms',
        'Terms of Service',
        'Terms of Service | DINA COSMETIC',
        'Terms and conditions for using the DINA COSMETIC store.',
        '{
     "heading": "Terms of Service",
     "last_updated": "2026-03-03",
     "sections": [
       {"title": "Acceptance",   "body": "By using this website you agree to these terms."},
       {"title": "Pricing",      "body": "All prices are in USD and subject to change."},
       {"title": "Returns",      "body": "30-day returns on unopened products."},
       {"title": "Contact",      "body": "Email: legal@dinacosmetic.store"}
     ]
   }'::jsonb,
        true
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_desc = EXCLUDED.meta_desc,
    content = EXCLUDED.content,
    updated_at = now();
-- ─────────────────────────────────────────────────────────────
-- § 9. THEME SETTINGS — DEFAULT SEED
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.theme_settings (theme_key, label, is_active, settings)
VALUES (
        'obsidian_palace',
        'Obsidian Palace (Default)',
        true,
        '{
    "colors": {
      "primary_bg":    "#0A0A0A",
      "secondary_bg":  "#111111",
      "accent_gold":   "#D4AF37",
      "text_primary":  "#F5F0E8",
      "text_muted":    "#8A8A8A",
      "border":        "#2A2A2A"
    },
    "fonts": {
      "heading": "Playfair Display",
      "body":    "Inter"
    },
    "layout": {
      "max_width":     "1280px",
      "border_radius": "4px",
      "header_style":  "sticky"
    }
  }'::jsonb
    ) ON CONFLICT (theme_key) DO
UPDATE
SET settings = EXCLUDED.settings,
    is_active = EXCLUDED.is_active,
    updated_at = now();
-- ─────────────────────────────────────────────────────────────
-- § 10. VERIFICATION
-- ─────────────────────────────────────────────────────────────
SELECT 'PRODUCTS columns' AS check,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name IN (
        'on_sale',
        'sale_price',
        'is_featured',
        'is_bestseller',
        'is_active'
    )
ORDER BY column_name;
SELECT 'NEW TABLES' AS check,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('navigation_menus', 'pages', 'theme_settings')
ORDER BY tablename;
SELECT 'FRONTEND CONTENT rows' AS check,
    COUNT(*) AS total_rows
FROM public.frontend_content;
SELECT 'SITE SETTINGS rows' AS check,
    setting_key
FROM public.site_settings
ORDER BY setting_key;
SELECT 'NAVIGATION MENUS' AS check,
    menu_key,
    label
FROM public.navigation_menus
ORDER BY display_order;