# StoreX — Headless E-Commerce Platform

> **Live Store (Client 1)**: [dinacosmetic.store](https://dinacosmetic.store)
> **Stack**: Next.js 16 · Supabase · Stripe · Shippo · Resend · Mux · Vercel
> **Version**: 2.5.0 — Admin CMS, Security Hardening & Full Audit

A full-stack, headless e-commerce platform purpose-built for **Dina Cosmetic** — a luxury beauty brand. Zero SaaS lock-in. 100% admin-owned infrastructure with an immersive luxury storefront and a fully-featured command portal.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.1.6](https://nextjs.org/) — App Router, Server Actions, Server Components |
| **Database** | [Supabase](https://supabase.com/) — PostgreSQL · Row Level Security · Storage |
| **Payments** | [Stripe](https://stripe.com/) — Hosted Checkout · Webhooks · Idempotent Events |
| **Shipping** | [Shippo](https://goshippo.com/) v2.18 — Label Generation · Live Rate Calculation |
| **Email** | [Resend](https://resend.com/) — Order Confirmations · Shipping Notifications |
| **Video** | [Mux](https://www.mux.com/) — Video upload, transcoding, and HLS streaming |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) — Design system with luxury tokens |
| **Language** | TypeScript (strict) |
| **Deployment** | [Vercel](https://vercel.com/) — Preview (dev) + Production (main) pipelines |

---

## ✨ Feature Overview

### 🛍️ Storefront
- CMS-driven pages — every page editable from admin, zero redeploys needed
- Full product catalog with variant support (shades, sizes, colors)
- Shopping bag drawer with live stock checks and hydration guard
- Stripe Hosted Checkout with worldwide shipping address collection
- Guest checkout + authenticated account orders
- Order history and tracking in customer account dashboard
- Dynamic free-shipping threshold (configurable in Admin)
- Hero slider with swipe gesture support on mobile
- Announcement bar with rotating admin-controlled messages
- Footer with live social media links (Instagram, TikTok, YouTube, Pinterest, Facebook)
- Mux-powered auto-playing video sections

### 🛠️ Admin Portal (`/admin`)
- **Dashboard** — Real-time KPIs: today's revenue, unfulfilled orders count, low-stock alerts
- **Products** — Full CRUD: create/edit/delete products with variant management, weight, images, stock toggle
- **Orders** — View, filter, status management, single + batch fulfillment via Shippo
- **Categories** — Manage product taxonomy with name, slug, description, cover image
- **CMS Pages (Experiences)** — Drag-and-drop block builder for pages (Hero, Image Banner, Philosophy Grid, Video, Rich Text, Contact Form, Product Grid)
- **Media Library** — Centralized image vault: upload, copy URL, delete, grid/list view
- **Video Manager** — Upload MP4/MOV via Mux, monitor processing status, publish to storefront
- **Analytics** — 7-day and 30-day revenue charts, top-selling products, order counts
- **Marketing** — Coupon/discount code engine (% and fixed), abandoned cart recovery with email trigger
- **Email Settings** — Customize transactional email templates (subject lines, content, accent colors)
- **Settings** — Store name/logo, Kill Switch (maintenance mode), Announcement Bar, Social Links, Navigation menus, Shipping rates
- **Users** — Customer directory with order history and admin role assignment
- **Guide** — Built-in operations manual (A-to-Z) for the store owner

---

## 🚀 Launch Checklist

### 1. Clone the Repository
```bash
git clone https://github.com/lead-matrix/storex.git
cd storex
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
```
Fill in every value. See the table below for where to find each one.

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API *(server-side only)* |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing Secret |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Your verified sender domain email |
| `SHIPPO_API_KEY` | goshippo.com → API Keys |
| `MUX_TOKEN_ID` | dashboard.mux.com → Settings → Access Tokens |
| `MUX_TOKEN_SECRET` | dashboard.mux.com → Settings → Access Tokens |
| `MUX_WEBHOOK_SECRET` | Mux → Webhooks → Signing Secret |
| `WAREHOUSE_NAME` | Your business name (for shipping labels) |
| `WAREHOUSE_STREET1` | Sender street address |
| `WAREHOUSE_CITY` | Sender city |
| `WAREHOUSE_STATE` | Sender state (2-letter, e.g. `CA`) |
| `WAREHOUSE_ZIP` | Sender ZIP code |
| `WAREHOUSE_COUNTRY` | Sender country (e.g. `US`) |
| `NEXT_PUBLIC_SITE_URL` | Your domain, e.g. `https://dinacosmetic.store` |

### 3. Database Setup
1. Open **Supabase SQL Editor**
2. Run **`DINA_COSMETIC_LAUNCH_READY.sql`** (project root) — this is the all-in-one launch-ready script containing the full schema, all chronological migrations, RLS policies, functions, and seed data.
3. **Safety Guarantee**: The script is **100% idempotent and non-destructive**. It strictly uses safe `IF NOT EXISTS` modifications and never touches live products, orders, or operational data. Safe to run repeatedly.

### 4. Create Your Admin Account
```sql
-- After signing up on the storefront, run in Supabase SQL Editor:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```
Then visit `/admin`.

### 5. Configure Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks → **Add Endpoint**
2. URL: `https://your-domain.com/api/webhook/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy the **Signing Secret** → paste as `STRIPE_WEBHOOK_SECRET` in Vercel

### 6. Configure Mux Webhook
1. Mux Dashboard → Settings → Webhooks → **Add Webhook**
2. URL: `https://your-domain.com/api/mux/webhook`
3. Events: `video.asset.ready`
4. Copy the **Signing Secret** → paste as `MUX_WEBHOOK_SECRET` in Vercel

### 7. Configure Supabase Auth
1. Supabase → Authentication → URL Configuration
2. **Site URL**: `https://dinacosmetic.store`
3. **Redirect URLs**: `https://dinacosmetic.store/auth/callback`
4. **Password Security**: Enable "Prevent use of leaked passwords" (HaveIBeenPwned)

### 8. Storage Buckets
1. Supabase → Storage → create bucket **`product-images`** → set **Public**
2. Supabase → Storage → create bucket **`videos`** → set **Public**
3. RLS: allow authenticated uploads, allow public reads

### 9. Run Locally
```bash
npm run dev
# Visit http://localhost:3000
# Admin: http://localhost:3000/admin
```

### 10. Deploy to Vercel
```bash
# Pushing to `dev` branch → Vercel Preview deployment
# Merging to `main` → Vercel Production deployment
git push origin main
```
Ensure all environment variables are set in **Vercel → Project → Settings → Environment Variables** for the Production environment.

---

## 📁 Project Structure

```
├── app/                        # Next.js App Router
│   ├── [slug]/                 # Dynamic CMS pages (force-dynamic)
│   ├── admin/                  # Admin Portal
│   │   ├── analytics/          # Revenue charts & KPIs
│   │   ├── builder/            # CMS experience builder engine
│   │   ├── categories/         # Product taxonomy
│   │   ├── cms/                # CMS page management + block editor
│   │   ├── email/              # Email template editor
│   │   ├── guide/              # Built-in A-to-Z operations manual
│   │   ├── marketing/          # Coupons & abandoned cart recovery
│   │   ├── media/              # Media library (images)
│   │   ├── orders/             # Order fulfillment & label generation
│   │   ├── products/           # Product & stock management
│   │   ├── settings/           # Store config, shipping, social, menus
│   │   ├── users/              # Customer directory & role management
│   │   └── videos/             # Mux video manager
│   ├── api/                    # API Routes
│   │   ├── admin/              # Admin-authenticated API endpoints
│   │   ├── checkout/           # Stripe session creation
│   │   ├── mux/                # Mux upload & webhook handlers
│   │   ├── shippo/             # Shipping rate calculation
│   │   └── webhook/stripe/     # Stripe payment confirmation webhook
│   ├── auth/                   # Auth handlers (PKCE callback)
│   ├── checkout/               # Checkout success/cancel pages
│   ├── product/                # Product detail pages
│   └── shop/                   # Store listing page + category filters
├── components/                 # UI Components
│   ├── admin/                  # Admin layout, forms, modals, editors
│   ├── cms/                    # CMS section renderers
│   └── ui/                     # Shared design system components
├── features/                   # Feature-scoped logic
│   ├── cart/                   # Shopping bag context & drawer
│   ├── checkout/               # Checkout flow components
│   ├── home/                   # Homepage sections
│   └── products/               # Product display components
├── lib/                        # Core infrastructure
│   ├── actions/                # Server Actions
│   │   ├── admin.ts            # Products, orders, inventory, settings
│   │   ├── cms.ts              # CMS page & section server actions
│   │   ├── cms-client.ts       # Client-compatible CMS actions
│   │   ├── coupons.ts          # Coupon management
│   │   └── recovery.ts         # Abandoned cart actions
│   ├── data/                   # Data fetchers (layout, products)
│   ├── db/                     # Low-level DB helpers (shipments, orders)
│   ├── supabase/               # DB clients (server, client, admin)
│   └── utils/                  # Helpers (email, shippo, etc.)
├── emails/                     # React Email templates
├── public/                     # Static assets
├── DINA_COSMETIC_LAUNCH_READY.sql # 🗄️ 100% Non-destructive launch-ready master database SQL schema
└── .env.example                # Environment variable template
```

---

## 🔐 Security Architecture

| Rule | Implementation |
|---|---|
| Server-side pricing | Prices always fetched from DB in checkout route — client values ignored |
| Stripe webhooks | Orders only confirmed via verified `checkout.session.completed` events |
| Idempotent events | `stripe_events` table prevents duplicate order processing |
| Row Level Security | All Supabase tables use per-operation RLS policies (no `FOR ALL`) |
| Admin middleware | `/admin` routes require `role = 'admin'` enforced server-side |
| Atomic inventory | Stock deducted inside DB transaction (`process_order_atomic` RPC) |
| Service role isolation | Admin Supabase client never exposed to client bundles |
| Auth consolidation | All server actions use canonical `requireAdmin()` from `lib/auth.ts` |
| Function search_path | All custom DB functions use `SET search_path = ''` to prevent injection |

---

## 🎨 Design System

| Token | Value |
|---|---|
| **Obsidian** | `#0B0B0D` (page background) |
| **Gold** | `#D4AF37` (primary accent) |
| **Pearl** | `#F5F4F0` (light surface) |
| **Charcoal** | `#1A1A1A` (headings) |
| **Heading font** | Playfair Display (luxury serif) |
| **Body font** | Inter (modern sans-serif) |

---

## 🔄 CI/CD Pipeline

| Branch | Deployment |
|---|---|
| `dev` | Vercel **Preview** — for testing changes before production |
| `main` | Vercel **Production** — live at `dinacosmetic.store` |

---

## 📋 Admin Panel Quick Reference

| URL | Purpose |
|---|---|
| `/admin` | Dashboard — live KPIs, today's revenue |
| `/admin/products` | Manage products, variants & inventory |
| `/admin/orders` | Fulfill orders & generate shipping labels |
| `/admin/categories` | Product taxonomy / collections |
| `/admin/cms` | CMS Experiences — build custom pages |
| `/admin/media` | Upload/manage images |
| `/admin/videos` | Upload/manage Mux video content |
| `/admin/analytics` | Revenue & sales charts |
| `/admin/marketing` | Coupon codes & abandoned cart recovery |
| `/admin/email` | Email template customization |
| `/admin/users` | Customer directory & admin role assignment |
| `/admin/settings` | Store config, social links, announcement bar, shipping |
| `/admin/settings/shipping` | Weight-based shipping rate editor |
| `/admin/guide` | Built-in A-to-Z operations manual |

---

## 🐛 Changelog

### v2.5.0 — April 2026 · Security Hardening & Full Audit
- **DB Security**: Fixed all Supabase linter warnings — locked down RLS policies (no more `FOR ALL`), fixed `function_search_path_mutable` on all public functions
- **Performance**: Replaced `auth.uid()` per-row evaluation with `(SELECT auth.uid())` in all RLS policies; eliminated duplicate indexes and redundant policies
- **Import Fix**: Fixed broken `../supabase` import in 6 `lib/db/*.ts` files that would cause runtime crashes on fulfillment routes
- **Auth Consolidation**: Replaced 5 copy-pasted `ensureAdmin()` implementations with canonical `requireAdmin()` from `lib/auth.ts`
- **Social Links Fixed**: Migrated social links data source from `site_settings` to `frontend_content` — admin changes now reflect instantly on storefront
- **Footer**: Added Pinterest icon support
- **Admin Dedup**: Added 30s fetch deduplication gate to AdminLayoutClient to prevent redundant revenue refetches on route changes
- **ShippingRateManager**: Removed silent localStorage fallback — save failures now show proper error toasts
- **isPriority LCP**: First 4 product cards in all grids now pass `isPriority={true}` to avoid lazy-loading above-the-fold images
- **Migrations**: Added `inventory_logs`, `builder_pages`, and `order_items` snapshot column migrations

### v2.3.0 — April 2026 · CMS Power-Up & Inventory Hardening
- Dynamic `PhilosophyGrid` with dedicated CMS editor and icon picker
- CMS migration: About, Contact, Privacy, Terms fully editable via Admin → Experiences
- Atomic stock deduction via PostgreSQL RPC to prevent race conditions on concurrent checkouts
- Reservation lifecycle and non-destructive DB constraints

### v2.2.0 — April 2026 · Mobile & Builder
- Fixed GitHub CI workflow
- CMS Builder mobile tab navigation, Media Library picker
- Admin sidebar 48px min-height tap targets
- Customer hero swipe gesture support

---

*Built and maintained by **Mahmud R B** · Version 2.5.0 · Last updated: April 8, 2026*
