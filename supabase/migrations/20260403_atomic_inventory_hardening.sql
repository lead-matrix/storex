-- ================================================================
--  DINA COSMETIC  ·  INVENTORY HARDENING  ·  2026-04-03
--  Incremental hardening for inventory reservations and atomic stock updates.
-- ================================================================

-- 1. Check & Reserve Inventory RPC
-- Called by checkoutService.ts BEFORE creating a Stripe session.
-- Returns error if stock (minus active reservations) is insufficient.
CREATE OR REPLACE FUNCTION public.check_and_reserve_inventory(
    p_items jsonb,          -- Array of {product_id, variant_id, quantity}
    p_order_id uuid,
    p_expires_in interval DEFAULT interval '30 minutes'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    item RECORD;
    v_available_stock integer;
    v_active_reservations integer;
BEGIN
    -- For each item in the request
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, variant_id uuid, quantity integer) LOOP
        
        -- A. Calculate effective available stock (Total Stock - Active Reservations)
        -- Lock the row first to prevent concurrent reservation checks
        IF item.variant_id IS NOT NULL THEN
            SELECT stock INTO v_available_stock FROM public.product_variants WHERE id = item.variant_id FOR UPDATE;
            
            SELECT COALESCE(SUM(quantity), 0) INTO v_active_reservations 
            FROM public.inventory_reservations 
            WHERE variant_id = item.variant_id AND expires_at > now();
        ELSE
            SELECT stock INTO v_available_stock FROM public.products WHERE id = item.product_id FOR UPDATE;
            
            SELECT COALESCE(SUM(quantity), 0) INTO v_active_reservations 
            FROM public.inventory_reservations 
            WHERE product_id = item.product_id AND variant_id IS NULL AND expires_at > now();
        END IF;

        -- B. Verify depth
        IF (v_available_stock - v_active_reservations) < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product % (Available: %, Reserved: %, Requested: %)', 
                item.product_id, v_available_stock, v_active_reservations, item.quantity;
        END IF;

        -- C. Create Reservation
        INSERT INTO public.inventory_reservations (
            product_id, 
            variant_id, 
            quantity, 
            session_id,     -- We use order_id as the session identifier
            expires_at
        ) VALUES (
            item.product_id,
            item.variant_id,
            item.quantity,
            p_order_id::text,
            now() + p_expires_in
        );
    END LOOP;
END;
$$;

-- 2. Enhanced process_order_atomic
-- Modified to consume reservations if they exist.
CREATE OR REPLACE FUNCTION public.finalize_order_inventory(
    p_order_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    item RECORD;
BEGIN
    -- 1. For each item in the order
    FOR item IN SELECT product_id, variant_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
        
        -- a. Deduct product stock (Atomic lock)
        PERFORM id FROM public.products WHERE id = item.product_id FOR UPDATE;
        UPDATE public.products
        SET stock = GREATEST(0, stock - item.quantity)
        WHERE id = item.product_id;

        -- b. Deduct product_variant stock (Atomic lock)
        IF item.variant_id IS NOT NULL THEN
            PERFORM id FROM public.product_variants WHERE id = item.variant_id FOR UPDATE;
            UPDATE public.product_variants
            SET stock = GREATEST(0, stock - item.quantity)
            WHERE id = item.variant_id;
        END IF;

    END LOOP;

    -- 2. Delete reservations for this order
    DELETE FROM public.inventory_reservations WHERE session_id = p_order_id::text;
END;
$$;

-- 3. Cleanup Crontab Helper (Optional but recommended)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations() 
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM public.inventory_reservations WHERE expires_at < now();
    SELECT count(*)::integer FROM public.inventory_reservations WHERE expires_at < now();
$$;
