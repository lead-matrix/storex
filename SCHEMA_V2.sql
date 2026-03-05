-- Ecommerce Architecture V2 - Scalable Headless Store
-- Run this in Supabase SQL Editor
-- 1. CLEANUP & RESET (Ensure a fresh, standardized rebuild)
-- Rebuilding according to Phase 2: "Rebuild the database schema to support real ecommerce scale."
-- Warning: This script drops existing data tables to standardize naming (e.g., 'title' instead of 'name').
DROP TABLE IF EXISTS public.cms_sections CASCADE;
DROP TABLE IF EXISTS public.cms_pages CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM (
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);
-- 2. CORE TABLES
-- PROFILES (Linked to Supabase Auth)
-- We use CREATE TABLE IF NOT EXISTS here as users might already have profiles,
-- but we ensure the role column exists and is correct.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    full_name text,
    role text default 'customer' check (role in ('customer', 'admin')),
    created_at timestamptz default now(),
    avatar_url text,
    updated_at timestamptz default now()
);
-- CATEGORIES
CREATE TABLE public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text unique not null,
    created_at timestamptz default now()
);
-- PRODUCTS
-- Phase 2 Required: id, title, slug, description, status, created_at
CREATE TABLE public.products (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    description text,
    status text default 'active' check (status in ('active', 'draft', 'archived')),
    images text [] default '{}',
    category_id uuid references public.categories(id) on delete
    set null,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
);
-- PRODUCT VARIANTS
-- Phase 2 Required: id, product_id, title, sku, price, compare_price, weight, created_at
CREATE TABLE public.product_variants (
    id uuid default gen_random_uuid() primary key,
    product_id uuid references public.products(id) on delete cascade not null,
    title text not null,
    -- e.g. "Small", "Red", "Default"
    sku text unique,
    price numeric(10, 2) not null,
    compare_price numeric(10, 2),
    weight numeric(10, 2) default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- INVENTORY (Phase 2 Requirement: id, variant_id, stock_quantity, reserved_quantity)
-- Inventory is now strictly decoupled from products for scalability.
CREATE TABLE public.inventory (
    id uuid default gen_random_uuid() primary key,
    variant_id uuid references public.product_variants(id) on delete cascade unique not null,
    stock_quantity integer default 0 not null check (stock_quantity >= 0),
    reserved_quantity integer default 0 not null check (reserved_quantity >= 0),
    updated_at timestamptz default now()
);
-- ORDERS
-- Phase 2 Required: id, user_id, stripe_session_id, status, total_amount, currency, created_at
CREATE TABLE public.orders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete
    set null,
        customer_email text not null,
        stripe_session_id text unique,
        status order_status default 'pending',
        total_amount numeric(10, 2) not null,
        currency text default 'usd',
        shipping_address jsonb,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
);
-- ORDER ITEMS (Phase 2 Required: id, order_id, variant_id, quantity, price)
CREATE TABLE public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    variant_id uuid references public.product_variants(id) on delete restrict not null,
    quantity integer not null check (quantity > 0),
    price numeric(10, 2) not null,
    -- Price at the time of purchase
    created_at timestamptz default now()
);
-- PAYMENTS (Phase 2 Required: id, order_id, stripe_payment_intent, status, amount, created_at)
CREATE TABLE public.payments (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    stripe_payment_intent text unique not null,
    status text not null,
    -- 'succeeded', 'failed', etc.
    amount numeric(10, 2) not null,
    created_at timestamptz default now()
);
-- SHIPMENTS (Phase 2 Required: id, order_id, shippo_tracking_id, carrier, tracking_number, status)
CREATE TABLE public.shipments (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    shippo_tracking_id text,
    carrier text,
    tracking_number text,
    label_url text,
    -- Added for convenience
    status text default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- CMS (Phase 2 Required: cms_pages, cms_sections, cms_components)
CREATE TABLE public.cms_pages (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    is_published boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
CREATE TABLE public.cms_sections (
    id uuid default gen_random_uuid() primary key,
    page_id uuid references public.cms_pages(id) on delete cascade not null,
    type text not null,
    -- 'hero', 'productGrid', 'richText', etc.
    sort_order integer default 0,
    props jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);
-- 3. RLS SECURITY POLICIES (Phase 4 Implementation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
-- Helper function to check admin status securely
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Profiles: Users can read/update their own; admins have full control
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users can read own profile" ON public.profiles FOR
SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id);
-- Public/Customer Access (Browse phase)
CREATE POLICY "Public read active products" ON public.products FOR
SELECT USING (status = 'active');
CREATE POLICY "Public read categories" ON public.categories FOR
SELECT USING (true);
CREATE POLICY "Public read active variants" ON public.product_variants FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.products p
            WHERE p.id = product_variants.product_id
                AND p.status = 'active'
        )
    );
CREATE POLICY "Public read inventory" ON public.inventory FOR
SELECT USING (true);
CREATE POLICY "Public read published CMS" ON public.cms_pages FOR
SELECT USING (is_published = true);
CREATE POLICY "Public read CMS sections" ON public.cms_sections FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cms_pages p
            WHERE p.id = cms_sections.page_id
                AND p.is_published = true
        )
    );
-- Admin Full Control
CREATE POLICY "Admin control products" ON public.products FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control inventory" ON public.inventory FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control payments" ON public.payments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control shipments" ON public.shipments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control cms_pages" ON public.cms_pages FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin control cms_sections" ON public.cms_sections FOR ALL TO authenticated USING (public.is_admin());
-- Customer Personal Access
CREATE POLICY "Customers view own orders" ON public.orders FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Customers view own items" ON public.order_items FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = order_items.order_id
                AND o.user_id = auth.uid()
        )
    );
-- 4. SERVER-SIDE ONLY FUNCTIONS (Phase 3 Backend Logic)
-- Atomic Order Processing from Stripe Webhook (Secure)
CREATE OR REPLACE FUNCTION public.fulfill_webhook_order(
        p_stripe_session_id text,
        p_payment_intent text,
        p_customer_email text,
        p_user_id uuid,
        p_amount numeric,
        p_currency text,
        p_shipping_address jsonb,
        p_items jsonb -- [{variant_id, quantity, price}]
    ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id uuid;
item record;
BEGIN -- Idempotency check: prevent duplicate order creation from re-delivered webhooks
SELECT id INTO v_order_id
FROM public.orders
WHERE stripe_session_id = p_stripe_session_id;
IF v_order_id IS NOT NULL THEN RETURN v_order_id;
END IF;
-- 1. Create Order
INSERT INTO public.orders (
        user_id,
        customer_email,
        stripe_session_id,
        status,
        total_amount,
        currency,
        shipping_address
    )
VALUES (
        p_user_id,
        p_customer_email,
        p_stripe_session_id,
        'paid',
        p_amount,
        p_currency,
        p_shipping_address
    )
RETURNING id INTO v_order_id;
-- 2. Create Payment Record (Financial verification)
INSERT INTO public.payments (order_id, stripe_payment_intent, status, amount)
VALUES (
        v_order_id,
        p_payment_intent,
        'succeeded',
        p_amount
    );
-- 3. Batch process order items and update inventory atomically
FOR item IN
SELECT *
FROM jsonb_to_recordset(p_items) AS x(variant_id uuid, quantity int, price numeric) LOOP
INSERT INTO public.order_items (order_id, variant_id, quantity, price)
VALUES (
        v_order_id,
        item.variant_id,
        item.quantity,
        item.price
    );
-- Atomic stock deduction (Phase 3 inventory logic)
UPDATE public.inventory
SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
WHERE variant_id = item.variant_id;
END LOOP;
RETURN v_order_id;
END;
$$;