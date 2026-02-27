-- ============================================================
--  LMXEngine · DINA COSMETIC · TRANSACTIONAL ORDER LOGIC
--  Critical RPC for Launch Ready status.
--  Handles atomic stock deduction and order creation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_order_atomic(
    p_stripe_session_id text,
    p_customer_email    text,
    p_amount_total      bigint, -- Stripe amounts are in cents
    p_currency          text,
    p_metadata          jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_order_id uuid;
    item_record  jsonb;
    v_items      jsonb;
BEGIN
    -- 1. Extract items from metadata
    v_items := (p_metadata->>'items')::jsonb;

    -- 2. Create the master order record
    INSERT INTO public.orders (
        stripe_session_id,
        customer_email,
        amount_total,
        currency,
        status,
        fulfillment_status
    )
    VALUES (
        p_stripe_session_id,
        p_customer_email,
        p_amount_total::numeric / 100.0, -- Convert cents to dollars
        p_currency,
        'paid',
        'unfulfilled'
    )
    RETURNING id INTO new_order_id;

    -- 3. Loop through items
    FOR item_record IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        -- A. Insert Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            price
        )
        VALUES (
            new_order_id,
            (item_record->>'product_id')::uuid,
            (item_record->>'variant_id')::uuid,
            (item_record->>'quantity')::integer,
            (item_record->>'price')::numeric
        );

        -- B. Deduct Stock from Product
        UPDATE public.products
        SET stock = stock - (item_record->>'quantity')::integer
        WHERE id = (item_record->>'product_id')::uuid;

        -- C. Deduct Stock from Variant (if applicable)
        IF (item_record->>'variant_id') IS NOT NULL THEN
            UPDATE public.variants
            SET stock = stock - (item_record->>'quantity')::integer
            WHERE id = (item_record->>'variant_id')::uuid;
        END IF;
    END LOOP;

END;
$$;
