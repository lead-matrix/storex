# DINA COSMETIC — The Obsidian Palace

> **Live store**: [dinacosmetic.store](https://dinacosmetic.store)  
> **Stack**: Next.js 16 · Supabase · Stripe · Shippo · Resend · Vercel  
> **Version**: 2.2.0 — Mobile & Builder Release

A full-stack, headless e-commerce platform purpose-built for **Dina Cosmetic** — a professional beauty brand. Zero SaaS lock-in. 100% admin-owned infrastructure with an immersive luxury storefront and a fully-featured command portal.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.1.6](https://nextjs.org/) — App Router, Server Actions, Server Components |
| **Database** | [Supabase](https://supabase.com/) — PostgreSQL · Row Level Security · Storage |
| **Payments** | [Stripe](https://stripe.com/) — Hosted Checkout · Webhooks · Idempotent Events |
| **Shipping** | [Shippo](https://goshippo.com/) v2.18 — Label Generation · Live Rate Calculation |
| **Email** | [Resend](https://resend.com/) — Order Confirmations · Shipping Notifications |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) — Design system with luxury tokens |
| **Language** | TypeScript (strict) |
| **Deployment** | [Vercel](https://vercel.com/) — Preview (dev) + Production (main) pipelines |

---

## ✨ Feature Overview

### Storefront
- Dynamic CMS-driven pages rendered from `cms_pages` database table
- Full product catalog with variant support (shades, sizes, colors)
- Shopping bag drawer with live stock checks
- Stripe Hosted Checkout with worldwide shipping address collection
- Guest checkout + authenticated account orders
- Order history and tracking in customer account dashboard
- Dynamic free shipping threshold logic (configurable in Admin)

### Admin Portal (`/admin`)
- **Dashboard** — Real-time KPIs: gross revenue, active orders, low-stock alerts
- **Products** — Full CRUD with variant management, status toggle, and stock adjustment
- **Orders** — Status management, single + batch fulfillment via Shippo, tracking integration
- **Experiences (CMS)** — Page builder for digital storytelling and custom landing pages
- **Media Library** — Centralized image vault with upload, copy URL, delete, and grid/list view
- **Analytics** — 7-day and 30-day revenue charts, top-selling products
- **Marketing** — Coupon/discount code engine (% and fixed), expiry + usage limits
- **Settings** — Operational status (Kill Switch), Live Shipping Rate configuration, Navigation menus, and Hero slides

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
| `SHIPPO_API_KEY` | goshippo.com → API Keys |
| `WAREHOUSE_*` | Your physical sender address for shipping labels |
| `NEXT_PUBLIC_SITE_URL` | Your domain, e.g. `https://localhost:3000` |

### 3. Database Setup
1. Open **Supabase SQL Editor**
2. Paste and run the full contents of **`MASTER.sql`** (project root)
3. The script is **idempotent** — safe to re-run without data loss

### 4. Create Your Admin Account
```bash
# After signing up on the storefront, run in Supabase SQL Editor:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```
Then visit `/admin`.

### 5. Configure Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks → **Add Endpoint**
2. URL: `https://your-domain.com/api/webhook/stripe`
3. Events: `checkout.session.completed`
4. Copy the **Signing Secret** → paste as `STRIPE_WEBHOOK_SECRET` in Vercel

### 6. Configure Supabase Auth
1. Supabase → Authentication → URL Configuration
2. **Site URL**: `https://dinacosmetic.store`
3. **Redirect URLs**: `https://dinacosmetic.store/auth/callback`

### 7. Storage Bucket
1. Supabase → Storage → create bucket named **`product-images`**
2. Set bucket to **Public**
3. RLS policies: allow authenticated uploads, allow public reads

### 8. Run Locally
```bash
npm run dev
# Visit http://localhost:3000
```

### 9. Deploy to Vercel
```bash
# Pushing to `dev` branch → Vercel Preview deployment
# Merging to `main` → Vercel Production deployment
git push origin dev
```
Ensure all environment variables from step 2 are set in **Vercel → Project → Settings → Environment Variables** for the Production environment.

---

## 📁 Project Structure

```
├── app/                        # Next.js App Router
│   ├── [slug]/                 # Dynamic CMS pages (from cms_pages table)
│   ├── admin/                  # Admin Portal
│   │   ├── analytics/          # Revenue charts & KPIs
│   │   ├── builder/            # 🆕 Experience builder engine
│   │   ├── categories/         # Product taxonomy
│   │   ├── cms/                # Page management (Experiences)
│   │   ├── email/              # Email template editor
│   │   ├── marketing/          # Coupons & abandoned carts
│   │   ├── media/              # Media library
│   │   ├── orders/             # Order fulfillment
│   │   ├── pages/              # CMS Page listing
│   │   ├── products/           # Product & stock management
│   │   ├── settings/           # Store & shipping configuration
│   │   └── users/              # Customer directory
│   ├── api/                    # API Routes
│   │   ├── admin/              # Admin-authenticated API endpoints
│   │   ├── checkout/           # Stripe session creation
│   │   ├── shippo/             # Shipping rate calculation
│   │   └── webhook/stripe/     # Stripe payment confirmation webhook
│   ├── auth/                   # Auth handlers (PKCE callback)
│   ├── checkout/               # Checkout success/cancel pages
│   ├── product/                # Product detail pages
│   └── shop/                   # Store listing page
├── components/                 # UI Components
│   ├── admin/                  # Admin layout, forms, modals
│   ├── cms/                    # CMS section renderers
│   └── ui/                     # Shared design system components
├── features/                   # Feature-scoped logic
│   ├── cart/                   # Shopping bag context & drawer
│   ├── checkout/               # Checkout flow components
│   ├── home/                   # Homepage sections
│   └── products/               # Product display components
├── lib/                        # Core infrastructure
│   ├── actions/                # Server Actions (admin.ts, cms.ts, coupons.ts)
│   ├── supabase/               # DB clients (server, client, admin)
│   └── utils/                  # Helpers (email, shippo, etc.)
├── emails/                     # React Email templates
├── public/                     # Static assets
├── proxy.ts                    # Next.js 16 edge middleware proxy
├── MASTER.sql                  # 🗄️ Single source of truth for DB schema
└── .env.example                # Environment variable template
```

---

## 🔐 Security Architecture

| Rule | Implementation |
|---|---|
| Server-side pricing | Prices always fetched from DB in checkout route — client values ignored |
| Stripe webhooks | Orders only confirmed via verified `checkout.session.completed` events |
| Idempotent events | `stripe_events` table prevents duplicate order processing |
| Row Level Security | All Supabase tables use RLS with role-based policies |
| Admin middleware | `/admin` routes require `role = 'admin'` enforced server-side |
| Atomic inventory | Stock deducted inside DB transaction (`process_order_atomic` RPC) |
| Service role isolation | Admin Supabase client never exposed to client bundles |

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

## 🐛 Bug Fixes & Changelog

### v2.2.0 — April 2026 · Mobile & Builder Improvements
- Fixed GitHub CI workflow: added required secrets and build step dependencies
- CMS Builder: added mobile tab navigation (Blocks / Preview / Settings panels)
- CMS Builder: added Media Library picker for all image fields
- Admin content labels: human-readable field names in Content tab
- Admin sidebar: increased tap targets to 48px min-height for mobile
- Customer hero: added swipe gesture support for mobile

### April 2026 — Image & Video Fixes

#### Image Display
- Fixed `object-contain` → `object-cover` across category grid, best sellers slider, split hero, and category pages
- Images now fill their containers edge-to-edge on all screen sizes (mobile and desktop)
- Product detail gallery retains `object-contain` intentionally for cosmetic product shots

#### Video Upload (Mux)
- Fixed 401 Unauthorized error on `/api/mux/create-upload`
- Added admin auth guard (user session + role check) matching all other admin API routes
- Separated service role client (for DB writes) from request-scoped client (for auth)

---

## 📋 Admin Panel Quick Reference

| URL | Purpose |
|---|---|
| `/admin` | Dashboard — live KPIs |
| `/admin/products` | Manage products, variants & inventory |
| `/admin/orders` | Fulfill orders & generate labels |
| `/admin/cms` | Experiences — Build custom landing pages |
| `/admin/media` | Upload/manage images |
| `/admin/analytics` | Revenue & sales charts |
| `/admin/marketing` | Coupon codes & abandoned carts |
| `/admin/settings` | Store config, shipping rates, menus |

---

*Built and maintained by **Mahmud R B** — Version 2.2.0*  
*Last updated: April 2026*
