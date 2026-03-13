-- 3. DATABASE SCHEMA
-- Robust Migration SQL for Supabase
-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    amount_total NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Add missing columns to orders if it existed before
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'payment_status'
) THEN
ALTER TABLE public.orders
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'fulfillment_status'
) THEN
ALTER TABLE public.orders
ADD COLUMN fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'shipping_address'
) THEN
ALTER TABLE public.orders
ADD COLUMN shipping_address JSONB NOT NULL DEFAULT '{}';
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL,
    variant_id UUID,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    weight NUMERIC(10, 4),
    length NUMERIC(10, 2),
    width NUMERIC(10, 2),
    height NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
-- Partial Fulfillment Support
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER NOT NULL DEFAULT 0;
-- Shipment Items (Linking specific items to shipments)
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON public.shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item_id ON public.shipment_items(order_item_id);
-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    shippo_shipment_id TEXT,
    carrier TEXT,
    service TEXT,
    shipping_cost NUMERIC(10, 2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shippo_shipment_id ON public.shipments(shippo_shipment_id);
-- Parcels
CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE RESTRICT,
    length NUMERIC(10, 2),
    width NUMERIC(10, 2),
    height NUMERIC(10, 2),
    distance_unit TEXT DEFAULT 'in',
    weight NUMERIC(10, 4),
    mass_unit TEXT DEFAULT 'lb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcels_shipment_id ON public.parcels(shipment_id);
-- Shipping Labels
CREATE TABLE IF NOT EXISTS public.shipping_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE RESTRICT,
    shippo_transaction_id TEXT,
    tracking_number TEXT,
    label_url TEXT,
    carrier TEXT,
    service TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_shipment_id ON public.shipping_labels(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking_number ON public.shipping_labels(tracking_number);
-- Shipment Tracking
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE RESTRICT,
    status TEXT,
    status_details TEXT,
    location JSONB,
    event_time TIMESTAMP WITH TIME ZONE,
    raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON public.shipment_tracking(shipment_id);
-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- ── COUPONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC NOT NULL,
    min_purchase_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add coupon link to orders
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'coupon_id'
) THEN
ALTER TABLE public.orders
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'discount_amount'
) THEN
ALTER TABLE public.orders
ADD COLUMN discount_amount NUMERIC DEFAULT 0;
END IF;
END $$;
-- RLS for Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view active coupons" ON public.coupons;
CREATE POLICY "coupons_select" ON public.coupons FOR
SELECT USING (
        (status = 'active')
        OR (
            SELECT public.is_admin()
        )
    );
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
-- ── ABANDONED CARTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    amount_total NUMERIC NOT NULL,
    recovery_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'emailed')),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS for Abandoned Carts
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to abandoned carts" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts_admin_all" ON public.abandoned_carts FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
-- ── INVENTORY LOGS (Rule 49) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    -- 'sale', 'restock', 'return', 'adjustment'
    order_id UUID REFERENCES public.orders(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to inventory logs" ON public.inventory_logs;
CREATE POLICY "inventory_logs_admin_all" ON public.inventory_logs FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- ── UNIFY ORDERS SCHEMA (Reconcile MASTER.sql and Migrations) ─────────
DO $$ BEGIN -- Ensure columns from both schemas exist to prevent app crashes
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'user_id'
) THEN
ALTER TABLE public.orders
ADD COLUMN user_id UUID REFERENCES auth.users(id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'status'
) THEN
ALTER TABLE public.orders
ADD COLUMN status TEXT DEFAULT 'pending';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'shipping_label_url'
) THEN
ALTER TABLE public.orders
ADD COLUMN shipping_label_url TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'tracking_number'
) THEN
ALTER TABLE public.orders
ADD COLUMN tracking_number TEXT;
END IF;
END $$;
-- ── RLS POLICIES FOR SHIPMENT TABLES ──────────────────────────────────
DROP POLICY IF EXISTS "Admins have full access to shipments" ON public.shipments;
CREATE POLICY "shipments_admin_all" ON public.shipments FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
DROP POLICY IF EXISTS "Admins have full access to parcels" ON public.parcels;
CREATE POLICY "parcels_admin_all" ON public.parcels FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
DROP POLICY IF EXISTS "Admins have full access to shipping labels" ON public.shipping_labels;
CREATE POLICY "shipping_labels_admin_all" ON public.shipping_labels FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
DROP POLICY IF EXISTS "Admins have full access to shipment items" ON public.shipment_items;
CREATE POLICY "shipment_items_admin_all" ON public.shipment_items FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
DROP POLICY IF EXISTS "Admins have full access to tracking" ON public.shipment_tracking;
CREATE POLICY "tracking_admin_all" ON public.shipment_tracking FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
-- ── STRIPE EVENTS (Rule 25) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id TEXT PRIMARY KEY,
    type TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view stripe events" ON public.stripe_events;
DROP POLICY IF EXISTS "stripe_events_admin_select" ON public.stripe_events;
CREATE POLICY "stripe_events_admin_select" ON public.stripe_events FOR
SELECT USING (
        (
            SELECT public.is_admin()
        )
    );
-- ── ORDERS & ITEMS POLICIES (Rule 18) ────────────────────────────────
-- (Ensuring users can see their own and admins see all)
DROP POLICY IF EXISTS "Users can see own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR
SELECT USING (
        (
            (
                SELECT auth.uid()
            ) = user_id
        )
        OR (
            SELECT public.is_admin()
        )
    );
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);
DROP POLICY IF EXISTS "Users can see own order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = order_items.order_id
                AND (
                    (
                        o.user_id = (
                            SELECT auth.uid()
                        )
                    )
                    OR (
                        SELECT public.is_admin()
                    )
                )
        )
    );
-- ── AUTOMATED INVENTORY LOGGING (Rule 49 & 50) ──────────────────────
CREATE OR REPLACE FUNCTION public.log_inventory_change() RETURNS TRIGGER AS $$ BEGIN IF (
        OLD.stock IS DISTINCT
        FROM NEW.stock
    ) THEN
INSERT INTO public.inventory_logs (variant_id, change_amount, reason)
VALUES (
        NEW.id,
        NEW.stock - OLD.stock,
        'Automated Stock Adjustment'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_log_inventory ON public.product_variants;
CREATE TRIGGER trg_log_inventory
AFTER
UPDATE OF stock ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.log_inventory_change();
-- Final Reconciliation Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);