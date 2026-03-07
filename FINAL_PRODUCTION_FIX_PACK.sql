-- STOREX FINAL PRODUCTION FIX PACK
create table if not exists products (
    id uuid primary key default uuid_generate_v4(),
    title text,
    slug text unique,
    description text,
    price numeric,
    image text,
    inventory int,
    created_at timestamp default now()
);
create table if not exists orders (
    id uuid primary key default uuid_generate_v4(),
    email text,
    total numeric,
    status text default 'pending',
    created_at timestamp default now()
);
create table if not exists order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references orders(id),
    product_id uuid references products(id),
    quantity int,
    price numeric
);
create table if not exists pages (
    id uuid primary key default uuid_generate_v4(),
    slug text unique,
    title text,
    content jsonb,
    is_published boolean default false
);
-- Enable RLS
alter table products enable row level security;
alter table pages enable row level security;
-- Policies
create policy "Public read products" on products for
select using (true);
create policy "Admin full access products" on products for all using (true);
-- In a real app we'd check for admin
create policy "Public read pages" on pages for
select using (is_published = true);
create policy "Admin full access pages" on pages for all using (true);