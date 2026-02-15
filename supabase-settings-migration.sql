-- =====================================================
-- SETTINGS TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can read settings" ON site_settings
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify settings" ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

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

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! Settings table ready
-- =====================================================
