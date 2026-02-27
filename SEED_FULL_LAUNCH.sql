-- ============================================================
--  LMXEngine · DINA COSMETIC · FULL LAUNCH SEED
--  Populates the database with the complete cosmetic range.
--  Aligns with the Obsidian Palace Luxury Identity.
-- ============================================================

-- 1. IDENTIFY CATEGORY IDs
-- Face: ID will be fetched
-- Eyes: ID will be fetched
-- Lips: ID will be fetched
-- Tools: ID will be fetched

DO $$ 
DECLARE
    face_id uuid;
    eyes_id uuid;
    lips_id uuid;
    tools_id uuid;
BEGIN
    -- Ensure categories exist and get their IDs
    INSERT INTO public.categories (name, slug, description)
    VALUES 
      ('Face', 'face', 'Exquisite complexion essentials.'),
      ('Eyes', 'eyes', 'Captivating high-pigment eye cosmetics.'),
      ('Lips', 'lips', 'Lustrous and enduring lip colors.'),
      ('Tools & Accessories', 'tools', 'Professional instruments for artistic precision.')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

    SELECT id INTO face_id FROM public.categories WHERE slug = 'face';
    SELECT id INTO eyes_id FROM public.categories WHERE slug = 'eyes';
    SELECT id INTO lips_id FROM public.categories WHERE slug = 'lips';
    SELECT id INTO tools_id FROM public.categories WHERE slug = 'tools';

    -- 2. INSERT PRODUCTS
    -- FACE COLLECTION
    INSERT INTO public.products (name, slug, base_price, description, category_id, stock, is_featured, is_active, images)
    VALUES 
      ('Luxurious Foundation', 'luxurious-foundation', 22.00, 'Matte finish, high-coverage foundation for a flawless obsidian glow.', face_id, 100, true, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Obsidian Face Powder', 'face-powder', 20.00, 'Ultra-fine compact powder for a velvety skin texture.', face_id, 120, false, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Velvet Setting Powder', 'setting-powder', 15.00, 'Loose translucent powder to lock in your masterpiece.', face_id, 80, false, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Mist of Gold Setting Spray', 'setting-spray', 16.00, 'Gilded hydration that sets makeup for 24 hours.', face_id, 60, true, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Primordial Face Primer', 'face-primer', 15.00, 'Smooths and prepares the canvas for intense pigments.', face_id, 90, false, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Sculpting Contour Stick', 'contour-stick', 12.99, 'Creamy definition for dramatic obsidian shadows.', face_id, 50, false, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('Ethereal Concealer', 'concealer', 10.00, 'Hides imperfections with a weightless silk formula.', face_id, 150, false, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']),
      ('3-in-1 Bloom Blush', 'bloom-blush', 25.00, 'Contour, Blush, and Highlight in one stunning palette.', face_id, 40, true, true, ARRAY['/luxury_makeup_face_collection_1772224740512.png']);

    -- EYES COLLECTION
    INSERT INTO public.products (name, slug, base_price, description, category_id, stock, is_featured, is_active, images)
    VALUES 
      ('Midnight Eyeshadow Palette', 'eyeshadow-palette', 25.00, 'Highly pigmented shades from deep onyx to sparkling gold.', eyes_id, 70, true, true, ARRAY['/luxury_makeup_eye_collection_1772224770135.png']),
      ('Crease-Defying Eye Primer', 'eye-primer', 8.00, 'Specifically designed for cut-crease and long-wear pigments.', eyes_id, 110, false, true, ARRAY['/luxury_makeup_eye_collection_1772224770135.png']),
      ('Onyx Mascara', 'mascara', 10.00, 'Enlarging mascara with deep black obsidian fibers.', eyes_id, 200, true, true, ARRAY['/luxury_makeup_eye_collection_1772224770135.png']),
      ('Precision Eyeliner', 'eyeliner', 12.00, 'Liquid gold-flecked black liner for a defined gaze.', eyes_id, 130, false, true, ARRAY['/luxury_makeup_eye_collection_1772224770135.png']),
      ('Arch Definition Eyebrow Pencil', 'eyebrow-pencil', 6.00, 'Fine-tip pencil for natural or dramatic brow sculpting.', eyes_id, 180, false, true, ARRAY['/luxury_makeup_eye_collection_1772224770135.png']);

    -- LIPS COLLECTION
    INSERT INTO public.products (name, slug, base_price, description, category_id, stock, is_featured, is_active, images)
    VALUES 
      ('Obsidian Matte Lipstick', 'matte-lipstick', 12.00, 'Intense color payoff with a luxurious non-drying finish.', lips_id, 140, true, true, ARRAY['/luxury_makeup_lip_collection_1772224796578.png']),
      ('Crystal Lip Gloss', 'lip-gloss', 14.00, 'High-shine finish with gold dust micro-particles.', lips_id, 90, false, true, ARRAY['/luxury_makeup_lip_collection_1772224796578.png']),
      ('Eternal Lip Tint', 'lip-tint', 12.00, 'Soft, buildable stain for a natural lip flush.', lips_id, 80, false, true, ARRAY['/luxury_makeup_lip_collection_1772224796578.png']),
      ('Dual-Soul 2-in-1 Lipstick', 'dual-lipstick', 16.00, 'Matte lipstick and Lipgloss in one elegant obsidian tube.', lips_id, 65, true, true, ARRAY['/luxury_makeup_lip_collection_1772224796578.png']);

    -- TOOLS & ACCESSORIES
    INSERT INTO public.products (name, slug, base_price, description, category_id, stock, is_featured, is_active, images)
    VALUES 
      ('Grand Master Brush Set (18pcs)', 'brush-set-18', 20.00, 'The complete professional set for full artistic mastery.', tools_id, 30, true, true, ARRAY['/luxury_makeup_tools_collection_1772224817128.png']),
      ('Artisan Brush Set (14pcs)', 'brush-set-14', 15.00, 'Essential collection for daily elegant rituals.', tools_id, 45, false, true, ARRAY['/luxury_makeup_tools_collection_1772224817128.png']),
      ('Pure Ritual Makeup Remover', 'makeup-remover', 12.00, '2-in-1 hydrating cleanser that dissolves even waterproof lipsticks.', tools_id, 100, false, true, ARRAY['/luxury_makeup_tools_collection_1772224817128.png']);

END $$;
