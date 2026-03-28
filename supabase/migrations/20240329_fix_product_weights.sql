-- Set default 2oz weight for products missing weight
UPDATE products 
SET weight_oz = 2.0 
WHERE (weight_oz IS NULL OR weight_oz = 0 OR weight_oz < 0.1)
AND status = 'active';

-- Set default 2oz weight for variants missing weight
UPDATE product_variants 
SET weight = 2.0 
WHERE (weight IS NULL OR weight = 0 OR weight < 0.1)
AND status = 'active';

-- Add helpful comment to weight columns
COMMENT ON COLUMN products.weight_oz IS 'Product weight in OUNCES';
COMMENT ON COLUMN product_variants.weight IS 'Variant weight in OUNCES';
