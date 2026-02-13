#!/bin/bash
# Deploy Obsidian Palace Admin Portal
# Requirements: supabase CLI, GitHub repo linked, Vercel CLI installed

set -e

echo "🏛️ Starting Obsidian Palace Admin Portal Deployment..."

# 1️⃣ Supabase Project Setup
echo "🔹 Creating Profiles table with RLS..."
supabase db query <<'SQL'
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    role text default 'customer',
    created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

-- Policies
create policy if not exists "Users can read own profile"
on profiles
for select
using (auth.uid() = id);

create policy if not exists "Admins can read all profiles"
on profiles
for select
using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy if not exists "Admins can update profiles"
on profiles
for update
using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
));
SQL

echo "✅ Profiles table and RLS policies created."

# 2️⃣ Add Admin User
read -p "Enter the Supabase Auth user ID to make admin: " ADMIN_ID
supabase db query <<SQL
update profiles
set role = 'admin'
where id = '$ADMIN_ID';
SQL

echo "✅ Admin user added."

# 3️⃣ Set Supabase Auth URLs
echo "🔹 Please set these manually in Supabase Auth → URL Configuration:"
echo "Site URL: https://www.dinacosmetic.store"
echo "Redirect URLs:"
echo "  https://www.dinacosmetic.store/admin/**"
echo "  http://localhost:3000/admin/**"

# 4️⃣ Vercel Environment Variables
echo "🔹 Ensure the following environment variables are set in Vercel:"
echo "NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY"
echo "STRIPE_PUBLISHABLE_KEY"
echo "STRIPE_SECRET_KEY (server-only)"

# 5️⃣ Build & Deploy Next.js Portal
echo "🔹 Installing dependencies..."
npm install

echo "🔹 Building Next.js project..."
npm run build

echo "🔹 Deploying to Vercel..."
vercel --prod

echo "🏆 Obsidian Palace Admin Portal is live!"
echo "Visit https://www.dinacosmetic.store/admin to verify dashboard access."
