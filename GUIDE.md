# DINA COSMETIC — OPERATIONAL PLAYBOOK
Official launch guide and architectural documentation for **DINA COSMETIC**.

> **Version**: 2.0.0 — Admin Ownership Release  
> **Engine**: Next.js 16.1.6 · Supabase · Stripe · Shippo · Resend · Vercel  
> **Live**: [dinacosmetic.store](https://dinacosmetic.store)

---

## 🗄️ 1. DATABASE ORCHESTRATION (SUPABASE)

### Fresh Setup
1. Open [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → **New Query**
2. Paste the entire contents of **`MASTER.sql`** (project root)
3. Run the script — zero errors expected

> **`MASTER.sql` is idempotent.** Safe to re-run at any time. It rebuilds schema, RLS policies, functions, and seeds the catalog without destroying existing data.

### Grant Admin Access
After signing up through the storefront:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## 🌐 2. ENVIRONMENT VARIABLES

All variables must be set in **Vercel → Project → Settings → Environment Variables** for production.

| Variable | Source | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | ✅ Server only |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing Secret | ✅ |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ |
| `SHIPPO_API_KEY` | goshippo.com → API Keys | ✅ |
| `WAREHOUSE_NAME` | Your warehouse/sender name | ✅ |
| `WAREHOUSE_ADDRESS_LINE1` | Street address | ✅ |
| `WAREHOUSE_CITY` | City | ✅ |
| `WAREHOUSE_STATE` | State code (e.g. TX) | ✅ |
| `WAREHOUSE_ZIP` | ZIP code | ✅ |
| `WAREHOUSE_COUNTRY` | Country name | ✅ |
| `WAREHOUSE_PHONE` | 10-digit phone number | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://dinacosmetic.store` | ✅ |
| `SMTP_HOST` | SMTP fallback server host | Optional |
| `SMTP_PORT` | SMTP port (465) | Optional |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials | Optional |

---

## 🗃️ 3. KEY DATABASE TABLES

| Table | Purpose |
|---|---|
| `profiles` | User registry — RBAC via `role` column (`admin` / `user`) |
| `products` | Product catalog — status `active`/`draft` controls storefront visibility |
| `product_variants` | Purchasable items with individual price, stock, SKU, and color swatch |
| `orders` | Immutable purchase records linked to Stripe session IDs |
| `order_items` | Snapshot of products/prices at purchase time |
| `stripe_events` | Idempotency log to prevent duplicate webhook processing |
| `coupons` | Discount codes with type, value, usage limits, and expiry |
| `cms_pages` | Dynamic pages rendered at `/{slug}` |
| `frontend_content` | Text content for hero sections, banners — editable from Media Library |
| `site_settings` | Kill switch, store name, tagline, warehouse, social links |
| `navigation_menus` | Header and footer menu items |

---

## 💳 4. STRIPE WEBHOOK SETUP

Required for orders to transition from **Pending → Paid**.

1. Stripe Dashboard → **Developers → Webhooks → Add Endpoint**
2. URL: `https://dinacosmetic.store/api/webhook/stripe`
3. Event: `checkout.session.completed`
4. Copy **Signing Secret** → save as `STRIPE_WEBHOOK_SECRET` in Vercel

**What the webhook does:**
- Verifies Stripe signature (rejects unsigned requests)
- Logs event to `stripe_events` (idempotency guard)
- Calls `process_order_atomic` RPC to create/update order and deduct inventory
- Sends order confirmation email via Resend

---

## 📦 5. ADMIN COMMAND CENTER — `/admin`

| Section | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Revenue, active orders, low-stock KPIs |
| Products | `/admin/products` | CRUD, variant management, stock +/-, status toggle |
| Orders | `/admin/orders` | Status updates, Shippo label generation, batch fulfillment |
| **Media Library** | `/admin/media` | 🆕 Upload images, manage asset vault, edit text content blocks |
| Inventory Vault | `/admin/vault` | Per-variant stock ledger with SECURE/CRITICAL/DEPLETED signals |
| Analytics | `/admin/analytics` | 7-day and 30-day revenue charts, top products |
| Marketing | `/admin/marketing` | Coupon codes (% or $), abandoned cart visibility |
| CMS | `/admin/cms` | Drag-and-drop custom page builder |
| Categories | `/admin/categories` | Product taxonomy |
| Clientele | `/admin/users` | Customer directory, VIP/Repeat/Lead segmentation, role management |
| Email | `/admin/email` | Transactional email template designer |
| Settings | `/admin/settings` | Store config, warehouse, hero slides, navigation menus, kill switch |

### ⚡ Global Search (Cmd + K)
Access the **Admin Command Palette** from any page in the portal using `Cmd+K` (or `Ctrl+K` on Windows). 
- Search **Products** by name or category
- Search **Orders** by ID or customer email
- Search **Users** by name or email
- Instant navigation with keyboard shortcuts.

---

## 🔐 6. SECURITY RULES (ENFORCED IN CODE)

- Pricing always calculated **server-side** — client values are never trusted
- Orders only confirmed from **verified Stripe webhook events** — never from client response
- All financial operations happen inside **database transactions** with full rollback
- `SUPABASE_SERVICE_ROLE_KEY` is **never exposed** to the browser
- Admin routes protected by `requireAdmin()` middleware — redirects to `/` if not `role = admin`
- RLS enabled on every table

---

## 🚢 7. LAUNCH CHECKLIST

```
☐  MASTER.sql executed successfully in Supabase SQL Editor
☐  Admin profile promoted: UPDATE profiles SET role = 'admin' WHERE email = '...'
☐  Supabase Storage bucket "product-images" created and set to Public
☐  All environment variables set in Vercel (Production environment)
☐  STRIPE_WEBHOOK_SECRET configured for https://dinacosmetic.store/api/webhook/stripe
☐  Supabase Auth Site URL set to https://dinacosmetic.store
☐  Supabase Auth Redirect URL includes https://dinacosmetic.store/auth/callback
☐  npm run build passes with zero errors locally
☐  First product created and visible at /shop
☐  Test order placed and confirmed (status changed to "paid" in /admin/orders)
```

---

## 🔄 8. GIT / DEPLOYMENT WORKFLOW

```
dev branch   →  Vercel Preview Deploy  (test all changes here first)
main branch  →  Vercel Production      (live at dinacosmetic.store)
```

```bash
# Standard workflow
git checkout dev
git add .
git commit -m "feat: your change description"
git push origin dev
# → Vercel preview URL generated automatically

# When ready for production
git checkout main
git merge dev
git push origin main
# → Vercel deploys to dinacosmetic.store
```

---

*Verified & Maintained by **Mahmud R B***  
*Last updated: March 2026 — v2.0.0*
