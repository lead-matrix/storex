DO $$
DECLARE face_id uuid;
eyes_id uuid;
lips_id uuid;
tools_id uuid;
prod_id uuid;
BEGIN -- Get Categories
SELECT id INTO face_id
FROM public.categories
WHERE slug = 'face';
SELECT id INTO eyes_id
FROM public.categories
WHERE slug = 'eyes';
SELECT id INTO lips_id
FROM public.categories
WHERE slug = 'lips';
SELECT id INTO tools_id
FROM public.categories
WHERE slug = 'tools';
-- 1. Makeup Brush Set
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Makeup Brush Set',
        'makeup-brush-set',
        'Professional grade brush set for flawless application. Includes 14 or 18 pieces for all your makeup needs.',
        tools_id,
        ARRAY ['/products/Brush-set-cover.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status
    )
VALUES (
        prod_id,
        '18 Pieces',
        'size',
        20.00,
        20,
        'BRUSH-18PCS',
        '/products/Brush-set-18pcs.jpg',
        0.8,
        'active'
    ),
    (
        prod_id,
        '14 Pieces',
        'size',
        15.00,
        20,
        'BRUSH-14PCS',
        '/products/Brush-set-14pcs.jpg',
        0.6,
        'active'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url;
-- 2. Lipsticks
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Lipsticks',
        'lipsticks',
        'Rich, creamy lipsticks for every occasion. Available in a variety of stunning shades.',
        lips_id,
        ARRAY ['/products/Solidcream-lipstick.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status,
        color_code
    )
VALUES (
        prod_id,
        'Rouge',
        'shade',
        15.00,
        5,
        'LIP-ROUGE',
        '/products/Solidmatte-lipstick-royal.jpg',
        0.1,
        'active',
        '#FF0000'
    ),
    (
        prod_id,
        'Purple',
        'shade',
        15.00,
        5,
        'LIP-PURPLE',
        '/products/Solidmatte-lipstick-purple.jpg',
        0.1,
        'active',
        '#800080'
    ),
    (
        prod_id,
        'Abricot',
        'shade',
        15.00,
        5,
        'LIP-ABRICOT',
        '/products/Solidlipstick-abrico.jpg',
        0.1,
        'active',
        '#FBCEB1'
    ),
    (
        prod_id,
        'Maroon',
        'shade',
        15.00,
        5,
        'LIP-MAROON',
        '/products/Solidcream-lipstick-marron.jpg',
        0.1,
        'active',
        '#800000'
    ),
    (
        prod_id,
        'Light Pink',
        'shade',
        15.00,
        5,
        'LIP-LIGHTPINK',
        '/products/Solidlipstick-lightpink.jpg',
        0.1,
        'active',
        '#FFB6C1'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    color_code = EXCLUDED.color_code;
-- 3. Liquid Matte Lipsticks
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Liquid Matte Lipsticks',
        'liquid-matte-lipsticks',
        'Long-lasting liquid matte lipsticks with an ultra-matte finish.',
        lips_id,
        ARRAY ['/products/Liquidmatte-lipstick.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status,
        color_code
    )
VALUES (
        prod_id,
        'Mauve',
        'shade',
        15.00,
        10,
        'LML-MAUVE',
        '/products/mauve.jpg',
        0.1,
        'active',
        '#E0B0FF'
    ),
    (
        prod_id,
        'Burgundy',
        'shade',
        15.00,
        5,
        'LML-BURGUNDY',
        '/products/Liq-lip-burgundy.jpg',
        0.1,
        'active',
        '#800020'
    ),
    (
        prod_id,
        'Rose Matte',
        'shade',
        15.00,
        5,
        'LML-ROSE',
        '/products/liq-lip-Rose-matte.jpg',
        0.1,
        'active',
        '#FF66CC'
    ),
    (
        prod_id,
        'Red',
        'shade',
        15.00,
        10,
        'LML-RED',
        '/products/liq-lip-red.jpg',
        0.1,
        'active',
        '#FF0000'
    ),
    (
        prod_id,
        'Abricot',
        'shade',
        15.00,
        5,
        'LML-ABRICOT',
        '/products/Liq-lip-abrico.jpg',
        0.1,
        'active',
        '#FBCEB1'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    color_code = EXCLUDED.color_code;
-- 4. Makeup Bag
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Makeup Bag',
        'makeup-bag',
        'Stylish and spacious makeup bags for all your beauty essentials.',
        tools_id,
        ARRAY ['/products/makeup-bag.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status
    )
VALUES (
        prod_id,
        'Medium Size',
        'size',
        10.00,
        10,
        'BAG-MED',
        '/products/makeup-bag.jpg',
        0.5,
        'active'
    ),
    (
        prod_id,
        'Small Size',
        'size',
        8.00,
        10,
        'BAG-SML',
        '/products/makeup-bag.jpg',
        0.3,
        'active'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url;
-- 5. Lip Gloss
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Lip Gloss',
        'lip-gloss',
        'High-shine lip gloss for a radiant and luscious look.',
        lips_id,
        ARRAY ['/products/liq-lip-gloss.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status,
        color_code
    )
VALUES (
        prod_id,
        'Gold',
        'shade',
        12.00,
        5,
        'GLOSS-GOLD',
        '/products/gold.jpg',
        0.1,
        'active',
        '#FFD700'
    ),
    (
        prod_id,
        'Rose',
        'shade',
        12.00,
        5,
        'GLOSS-ROSE',
        '/products/rose.jpg',
        0.1,
        'active',
        '#FF66CC'
    ),
    (
        prod_id,
        'Brown',
        'shade',
        12.00,
        5,
        'GLOSS-BROWN',
        '/products/brown.jpg',
        0.1,
        'active',
        '#A52A2A'
    ),
    (
        prod_id,
        'Nature',
        'shade',
        12.00,
        5,
        'GLOSS-NATURE',
        '/products/nature.jpg',
        0.1,
        'active',
        '#D2B48C'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    color_code = EXCLUDED.color_code;
-- 6. Matte Lipsticks (Single)
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Matte Lipsticks',
        'matte-lipsticks-single',
        'Classic matte lipstick for a bold statement and comfortable wear.',
        lips_id,
        ARRAY ['/products/matte-lipstick.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status
    )
VALUES (
        prod_id,
        'Default',
        'option',
        15.00,
        10,
        'MATTE-LIP-SGL',
        '/products/matte-lipstick.jpg',
        0.1,
        'active'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url;
-- 7. Foundations (Single)
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Foundations',
        'foundations-single',
        'Flawless coverage foundations for a perfect complexion.',
        face_id,
        ARRAY ['/products/foundation.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status
    )
VALUES (
        prod_id,
        'Default',
        'option',
        15.00,
        10,
        'FOUNDATION-SGL',
        '/products/foundation.jpg',
        0.4,
        'active'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url;
-- 8. Eyeshadow Primer (Single)
INSERT INTO public.products (
        title,
        slug,
        description,
        category_id,
        images,
        status
    )
VALUES (
        'Eyeshadow Primer',
        'eyeshadow-primer-single',
        'Long-lasting eyeshadow primer for vibrant and crease-free eye makeup.',
        eyes_id,
        ARRAY ['/products/eyeshadow-primer.jpg'],
        'active'
    ) ON CONFLICT (slug) DO
UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description
RETURNING id INTO prod_id;
INSERT INTO public.product_variants (
        product_id,
        name,
        variant_type,
        price_override,
        stock,
        sku,
        image_url,
        weight,
        status
    )
VALUES (
        prod_id,
        'Default',
        'option',
        8.99,
        10,
        'ES-PRIMER-SGL',
        '/products/eyeshadow-primer.jpg',
        0.2,
        'active'
    ) ON CONFLICT (sku) DO
UPDATE
SET price_override = EXCLUDED.price_override,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url;
END $$;