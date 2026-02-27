-- ============================================================
--  LMXEngine · DINA COSMETIC · UNSEAL THE VAULT
--  Final cleanup and data activation.
-- ============================================================

-- 1. Ensure all products are active if they aren't explicitly marked otherwise
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- 2. Correct common column name discrepancies if they exist
DO $$ 
BEGIN
    -- Ensure profiles roles are capitalized as expected or standardized
    UPDATE public.profiles SET role = 'admin' WHERE email = 'arafat.leadmatrix@gmail.com';
    
    -- Ensure categories have correct order if needed
    UPDATE public.categories SET name = 'Tools & Accessories' WHERE slug = 'tools';
END $$;

-- 3. Verify images are properly formatted as JSONB ARRAYS
UPDATE public.products 
SET images = ARRAY['/logo.jpg'] 
WHERE images IS NULL OR array_length(images, 1) = 0;
