# DINA COSMETIC — Admin & Deployment Guide

> **The Obsidian Palace** · LMXEngine · Built on Next.js 15 + Supabase + Stripe

---

## Table of Contents

1. [What Was Built](#1-what-was-built)
2. [Admin Portal — Features & How to Use](#2-admin-portal--features--how-to-use)
3. [Database Setup](#3-database-setup)
4. [Environment Variables](#4-environment-variables)
5. [Deploy to Vercel](#5-deploy-to-vercel)
6. [Post-Deploy Checklist](#6-post-deploy-checklist)
7. [Storefront Routes](#7-storefront-routes)
8. [Architecture Notes](#8-architecture-notes)

---

## 1. What Was Built

### Storefront (`/`)
| Route | Description |
|---|---|
| `/` | Homepage with hero, featured products, collections teaser |
| `/shop` | Full product catalogue with real-time Supabase updates |
| `/collections` | Curated vault index — links dynamically to DB categories |
| `/collections/[slug]` | Individual collection page — filtered by category slug |
| `/product/[slug]` | Single product detail with variants & add-to-cart |
| `/account` | Customer order history and profile |
| `/login` | Supabase Auth email/password + magic link |
| `/cart` | Shopping bag drawer (client component) |
| `/checkout` | Stripe Checkout session redirect |
| `/checkout/success` | Post-payment confirmation page |
| `/about` | Brand story page |
| `/contact` | Contact form (Resend) |

### Admin Portal (`/admin`)
| Route | Description |
|---|---|
| `/admin` | **Command Center** — live stats dashboard |
| `/admin/products` | Product list with inline actions |
| `/admin/products/new` | Create product with image upload |
| `/admin/products/[id]` | Edit product details, images, stock |
| `/admin/orders` | Order fulfilment table with status controls |
| `/admin/categories` | Category management |
| `/admin/users` | Customer directory |
| `/admin/settings` | Site settings and frontend content editor |

### API Routes (`/app/api`)
| Route | Description |
|---|---|
| `/api/checkout` | Creates Stripe Checkout session (server-side) |
| `/api/webhooks/stripe` | Receives and verifies Stripe events |

---

## 2. Admin Portal — Features & How to Use

### Accessing Admin

1. Log in at `/login` with your admin email
2. Your `profiles.role` must be `'admin'` in Supabase
3. Navigate to `/admin` — non-admin users are redirected to `/`

> **To make an account admin:** In Supabase → Table Editor → `profiles` → find your row → set `role` to `admin`

---

### Command Center Dashboard (`/admin`)

**Live stats refreshed on every page load:**
- **Total Revenue** — sum of all `paid` orders
- **Orders** — total order count
- **Low Stock** — products with `inventory < 5`
- **Customers** — total registered users

**Quick Actions grid:**
- → New Product
- → View Orders
- → Manage Categories
- → Site Settings

**Low Stock Alerts panel** — top 5 products by lowest inventory, click to edit

**Recent Transactions table** — last 8 orders with status badges and amounts

---

### Product Management (`/admin/products`)

#### Creating a Product
1. Click **"New Product"** or go to `/admin/products/new`
2. Fill in:
   - **Name** (required)
   - **Description**
   - **Price** (in USD, e.g. `49.99`)
   - **Stock / Inventory** quantity
   - **Category** — dropdown populated from DB
   - **Images** — drag & drop upload to Supabase Storage
   - **Active** toggle — only active products appear in the store
3. Click **Save** — page revalidates instantly

#### Editing a Product
1. Click any product row → `/admin/products/[id]`
2. Same form, pre-filled with existing data
3. Upload new images or remove old ones
4. Save — changes reflect on storefront immediately (ISR revalidation)

#### Deleting a Product
- Delete button on the product list row
- Product is removed from DB and storefront

---

### Order Fulfilment (`/admin/orders`)

**Status values:** `pending` → `paid` → `shipped` → `delivered` | `cancelled` | `refunded`

**Workflow:**
1. Order arrives as `pending` when checkout starts
2. Stripe webhook (`/api/webhooks/stripe`) marks it `paid` automatically
3. Admin manually marks `shipped` after generating a label
4. Shippo label generation available via the order detail action button
5. Tracking number is stored and visible to the customer in `/account`

**Important:** Orders are **immutable after payment** per security rules. Status can advance but items cannot be changed.

---

### Category Management (`/admin/categories`)

- Add categories with `name`, `slug`, `description`, `image_url`
- Slug must be URL-safe (e.g. `skincare`, `lip-collection`)
- Categories appear in shop filter and `/collections/[slug]` pages
- Deleting a category does **not** delete products (FK set to NULL)

---

### Site Settings (`/admin/settings`)

Edits content stored in `site_settings` and `frontend_content` tables:
- Hero headline and subtitle
- Store name and tagline
- **Kill Switch** — set `store_enabled` to `false` to show a maintenance page

---

## 3. Database Setup

### Run in Supabase SQL Editor

> **Supabase → SQL Editor → New Query → Paste → Run**

**Use `DATABASE_FINAL.sql`** — this is the single source of truth. It:
- Adds all missing columns to existing tables
- Creates `variants`, `site_settings`, `frontend_content` tables
- Sets exactly **4 RLS policies per table** (SELECT / INSERT / UPDATE / DELETE)
- Uses `(select auth.uid())` pattern — zero performance warnings
- Creates all indexes, triggers, and the `admin_sales_stats` view
- Seeds default settings

### Make Yourself Admin

After running the SQL and creating your account:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

### Storage Bucket

The SQL creates the `product-images` bucket automatically. Configure storage policies via:
> **Supabase → Storage → product-images → Policies**

Add:
- `SELECT`: `true` (public read)
- `INSERT/UPDATE/DELETE`: `(select role from profiles where id = auth.uid()) = 'admin'`

---

## 4. Environment Variables

Create `.env.local` (never commit this file):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zsahskxejgbrvfhobfyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# Shipping (Shippo)
SHIPPO_API_KEY=shippo_live_...

# App
NEXT_PUBLIC_SITE_URL=https://dinacosmetic.store
```

### Vercel Environment Variables

Add all of the above to:
> **Vercel → Project → Settings → Environment Variables**

Set for **Production**, **Preview**, and **Development**.

---

## 5. Deploy to Vercel

### First Deployment

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# From project root
vercel --prod
```

Or connect via GitHub:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `lead-matrix/LMXEngine`
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables
5. Deploy

### Subsequent Deploys

```bash
git push origin main
```
Vercel auto-deploys on every push to `main`.

### Stripe Webhook (Production)

After deploying, register your webhook:
1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://dinacosmetic.store/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Vercel

### Supabase Auth Redirect URLs

In **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://dinacosmetic.store`
- **Redirect URLs:**
  ```
  https://dinacosmetic.store/**
  http://localhost:3000/**
  ```

---

## 6. Post-Deploy Checklist

```
□ DATABASE_FINAL.sql run successfully in Supabase SQL Editor
□ Admin account role set to 'admin' in profiles table
□ All environment variables added to Vercel
□ Stripe webhook registered with correct endpoint
□ Supabase Auth redirect URLs configured
□ product-images storage bucket is public
□ Test: Create a product via /admin/products/new
□ Test: Place a test order with Stripe test card 4242 4242 4242 4242
□ Test: Verify webhook fires and order status changes to 'paid'
□ Test: /admin Command Center shows correct stats
□ Test: /collections loads categories from DB
□ Test: /collections/[slug] filters products correctly
```

---

## 7. Storefront Routes

### Customer Flow
```
/ → /shop → /product/[slug] → (add to cart) → /checkout → /checkout/success
                                                          → (Stripe webhook fires)
                                                          → Order marked 'paid'
                                                          → Confirmation email sent
```

### Auth Flow
```
/login → Supabase Auth → redirect to /account (or previous page)
/account → view orders, update profile
```

---

## 8. Architecture Notes

### Security
- All pricing calculated **server-side** — client never submits prices
- Stripe webhook verified with `STRIPE_WEBHOOK_SECRET` signature
- Admin routes protected by middleware + server-side role check
- `SUPABASE_SERVICE_ROLE_KEY` only used in server components and API routes
- RLS enabled on all tables with zero policy conflicts

### Performance
- Product lists use `revalidate = 60` (ISR — fresh every 60s)
- Admin dashboard is fully dynamic (no cache)
- All `auth.uid()` calls use `(select auth.uid())` pattern (single eval per query)
- Exactly 4 RLS policies per table (no redundant evaluation)
- Indexed columns: `is_active`, `category_id`, `inventory`, `slug`, `status`, `created_at`

### Real-time
- `ProductGrid` subscribes to Supabase Realtime — product updates appear instantly
- Admin orders page refreshes on status change

### Image Uploads
- Stored in Supabase Storage `product-images` bucket (public CDN)
- Uploaded via drag-and-drop in `ImageUpload` component
- `next/image` used throughout with `sizes` attribute for responsive loading

---

*Last updated: 2026-02-26 · LMXEngine / DINA COSMETIC*
