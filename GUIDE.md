# DINA COSMETIC — Complete Operations Guide

> **The Obsidian Palace** · Next.js 15 + Supabase + Stripe + Vercel  
> Admin email: `leadmatrix.us@gmail.com` · `arafat.leadmatrix@gmail.com`

---

## Quick Reference

| Task | Where |
|---|---|
| Run database | Supabase → SQL Editor → paste `MASTER.sql` → Run |
| Access admin | `https://dinacosmetic.store/admin` |
| Add product | `/admin/products/new` |
| View orders | `/admin/orders` |
| Kill switch | Supabase → `site_settings` → set `store_enabled` = `false` |
| Stripe webhooks | Stripe Dashboard → Webhooks → add endpoint |

---

## 1. Database Setup (Run Once — or Re-run Safely)

### Step-by-step

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New Query**
3. Open `MASTER.sql` from this repo — copy **all** contents
4. Paste into the editor → click **Run**

`MASTER.sql` is **fully idempotent** — safe to run multiple times. It will:
- Create all tables with correct columns
- Enable RLS on every table
- Drop **all** existing policies (nuclear clean slate)
- Recreate exactly **4 clean policies per table** (zero linter warnings)
- Create triggers, indexes, storage bucket, and seed data
- Promote both admin emails to `role = 'admin'`

### Admin Account

Both accounts are automatically promoted to admin when `MASTER.sql` runs:

```
leadmatrix.us@gmail.com    ← primary admin
arafat.leadmatrix@gmail.com
```

If you create a new admin account later, run this in the SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
```

### Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User accounts + role (user/admin) |
| `categories` | 4 root: Face, Eyes, Lips, Tools & Accessories |
| `products` | Full product catalog with slug, pricing, stock, images |
| `variants` | Product variants (shade, size, etc.) with stock |
| `orders` | Purchase orders linked to Stripe sessions |
| `order_items` | Line items per order |
| `stripe_events` | Idempotency log for webhook deduplication |
| `site_settings` | Key-value config (store name, kill switch, shipping) |
| `frontend_content` | CMS content (hero headline, etc.) |
| `newsletter_subscribers` | Email subscribers |

---

## 2. Environment Variables

Create `.env.local` (never commit this file — it's in `.gitignore`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

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

**Where to find these:**
- Supabase keys → Supabase Dashboard → Settings → API
- Stripe keys → Stripe Dashboard → Developers → API Keys
- Stripe webhook secret → set up webhook first (see §4), then copy the signing secret
- Resend key → resend.com → API Keys
- Shippo key → goshippo.com → API → API Keys

---

## 3. Admin Portal Usage

### Login

1. Go to `https://dinacosmetic.store/login`
2. Sign in with `leadmatrix.us@gmail.com`
3. Navigate to `/admin` — you'll be redirected if not an admin

### Dashboard (`/admin`)

Live stats on every page load:
- **Gross Revenue** — sum of all `paid` orders
- **Total Orders** — all time count
- **Active Products** — is_active = true
- **Customers** — registered user count
- **Sales Timeline** — 7-day revenue sparkline chart
- **Top Products** — donut chart by order volume
- **Recent Orders** — last 6 orders with status + amount
- **Low Stock Alerts** — products with stock < 5

### Product Management (`/admin/products`)

**Create a product:**
1. Click **+ Add Product**
2. Fill: Name, Description, Price (USD), Stock, Category, Images
3. Toggle **Active** to make it visible in the store
4. Click **Save**

**Edit a product:**
- Click any product row → edit form at `/admin/products/[id]`
- Upload new images via drag-and-drop
- Changes reflect on the storefront within 60 seconds (ISR)

**Delete:** Delete button on the product list row

**Product fields:**
| Field | Notes |
|---|---|
| `name` | Display name in store |
| `slug` | URL path, auto-generated from name |
| `base_price` | Price in USD (e.g. 22.00) |
| `stock` | Units available, deducted on purchase |
| `category_id` | One of: Face, Eyes, Lips, Tools & Accessories |
| `is_active` | false = hidden from storefront |
| `is_featured` | Appears in homepage featured grid |
| `images` | Array of public URLs from Supabase Storage |

### Order Fulfilment (`/admin/orders`)

**Order lifecycle:**
```
pending → paid (Stripe webhook) → shipped (manual) → delivered
                                → cancelled
                                → refunded
```

**How to fulfill:**
1. New orders appear as `paid` (set automatically by Stripe webhook)
2. Open the order → click **Mark Shipped**
3. Enter tracking number (Shippo integration)
4. Customer sees tracking in their `/account` page

**Important:** Orders are immutable after payment. Items cannot be changed.

### Category Management (`/admin/categories`)

- 4 root categories are seeded: Face, Eyes, Lips, Tools & Accessories
- Add subcategories with: name, slug (URL-safe), description, image_url
- Products belong to exactly one category
- Deleting a category nullifies FK on affected products (does NOT delete them)

### Site Settings (`/admin/settings`)

| Key | Description |
|---|---|
| `store_info` | Store name, tagline, currency |
| `store_enabled` | Set to `false` to show maintenance page |
| `shipping` | Free threshold and flat rate |

**Kill Switch:**
```sql
-- In Supabase SQL Editor — takes effect immediately
UPDATE public.site_settings
SET setting_value = 'false'
WHERE setting_key = 'store_enabled';
```

---

## 4. Deployment (Vercel)

### First Deploy

```bash
# Push to GitHub first
git add .
git commit -m "production ready"
git push origin main
```

Then:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `lead-matrix/storex` (or your repo)
3. Framework: **Next.js** (auto-detected)
4. Add **all environment variables** from §2
5. Click **Deploy**

### Subsequent Deploys

```bash
git push origin main
```
Vercel auto-deploys on every push to `main`.

### Stripe Webhook (Required for orders to work)

1. [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add Endpoint**
3. URL: `https://dinacosmetic.store/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** → add to Vercel as `STRIPE_WEBHOOK_SECRET`

### Supabase Auth Config

In **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://dinacosmetic.store`
- **Redirect URLs:**
  ```
  https://dinacosmetic.store/**
  http://localhost:3000/**
  ```

---

## 5. Post-Deploy Checklist

```
□ MASTER.sql run successfully in Supabase SQL Editor
□ Verified: profiles table shows role = 'admin' for both admin emails
□ All env variables added to Vercel (Production + Preview + Development)
□ Stripe webhook endpoint registered and signing secret set
□ Supabase Auth Site URL and redirect URLs configured
□ product-images storage bucket is public
□ Test: Visit /admin → Dashboard loads with stats
□ Test: Create a product via /admin/products/new
□ Test: Product appears on /shop
□ Test: Place order with Stripe test card: 4242 4242 4242 4242
□ Test: Webhook fires → order status changes to 'paid' in /admin/orders
□ Test: /collections loads all 4 categories
□ Test: /collections/face filters Face products correctly
□ Test: Mobile — logo shows "DINA COSMETIC" in header
```

---

## 6. Storefront Routes

### Public Routes
| Route | Description |
|---|---|
| `/` | Homepage — hero, featured products, newsletter |
| `/shop` | Full catalogue with all active products |
| `/collections` | Category index — all 4 collections |
| `/collections/[slug]` | Filtered by category (face/eyes/lips/tools) |
| `/product/[slug]` | Product detail — variants, add to cart |
| `/checkout` | Stripe Checkout redirect |
| `/checkout/success` | Post-payment confirmation |
| `/account` | Order history + profile (auth required) |
| `/login` | Supabase Auth — email/password + magic link |
| `/about` | Brand story |
| `/contact` | Contact form (Resend) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### Admin Routes (role = 'admin' required)
| Route | Description |
|---|---|
| `/admin` | Command Center dashboard |
| `/admin/products` | Product list + quick actions |
| `/admin/products/new` | Create product |
| `/admin/products/[id]` | Edit product |
| `/admin/orders` | Order fulfilment table |
| `/admin/categories` | Category management |
| `/admin/users` | Customer directory |
| `/admin/settings` | Site settings + content editor |

### API Routes
| Route | Description |
|---|---|
| `POST /api/checkout` | Creates Stripe Checkout session (server-side only) |
| `POST /api/webhooks/stripe` | Receives + verifies Stripe events; marks orders paid |

---

## 7. Architecture Notes

### Security Model
- All pricing calculated **server-side** — client never submits amounts
- Stripe webhook verified with `STRIPE_WEBHOOK_SECRET` before any DB write
- Admin routes protected via `requireAdmin()` in `route-guard.ts`
- `SUPABASE_SERVICE_ROLE_KEY` only used in server components and API routes
- RLS enabled on **all** tables — exactly 4 policies per table, zero conflicts
- `auth.uid()` always wrapped in `(SELECT auth.uid())` — no per-row re-evaluation

### Performance
- Product lists use ISR with `revalidate = 60` (stale at most 60s)
- Admin dashboard is `force-dynamic` (always fresh)
- Indexed columns: `is_active`, `category_id`, `slug`, `status`, `created_at`, `user_id`
- Newsletter INSERT validates email format server-side via regex

### Order Flow (Technical)
```
Customer → /checkout → POST /api/checkout → Stripe session created
         ← redirect to Stripe hosted page
         ← payment completes
         → Stripe fires checkout.session.completed webhook
         → POST /api/webhooks/stripe verifies signature
         → calls process_order_atomic() RPC
         → atomically: creates order + inserts items + deducts stock
         → order.status = 'paid'
         → Resend sends confirmation email
```

---

*DINA COSMETIC · The Obsidian Palace · LMXEngine*  
*Last updated: 2026-03-03*
