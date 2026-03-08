# DINA COSMETIC - THE OBSIDIAN PALACE
A high-performance, ultra-luxury e-commerce engine designed for the elite professional beauty industry. Built using the "Obsidian Standard" architecture for uncompromising performance, security, and aesthetics.

## 🏗️ THE TECHNOLOGY STACK
- **Framework**: [Next.js 16.1.6](https://nextjs.org/) (Full App Router Architecture)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Fine-Grained RLS)
- **Payment Infrastructure**: [Stripe](https://stripe.com/) (Service-Side Logic with Webhook Guards)
- **Logistics**: [Shippo](https://goshippo.com/) (Server-Side Rate Calculation)
- **Communications**: [Resend](https://resend.com/) (Automated Order Rituals)
- **Content Management**: Interactive Drag-and-Drop Page Builder & CMS
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Core Engine**: TypeScript (Strict Mode)

---

## 🚀 THE LAUNCH RITUAL (DEPLOYMENT GUIDE)

Follow these steps with precision to go live with the Obsidian Palace.

### 1. Environment Orchestration
Create a `.env.local` (local) and mirror these variables to your Vercel/Production dashboard:

```bash
# SUPABASE COMMAND & CONTROL
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # CRITICAL: KEEP PRIVATE

# THE PAYMENT VAULT (STRIPE)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # Verified after creating Webhook in Stripe Dashboard

# LOGISTICS & COMMUNICATION
RESEND_API_KEY=re_...
SHIPPO_API_KEY=shippo_live_...

# PRODUCTION URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Database Initialization
1. Navigate to the **Supabase SQL Editor**.
2. Run the **`MASTER.sql`** script found in the root directory.
    - This creates the schema, establishes the strict RLS (Row Level Security), fixes performance bottlenecks, creates the builder tables, and seeds the initial luxury items.
3. **Idempotency**: This script is safe to rerun at any point; it will non-destructively sync the schema.

### 3. Activating The Admin Portal
To gain access to the secure administrative command center:
1. Sign up/Login to the frontend of your application.
2. In the Supabase SQL Editor, promote your profile to 'admin':
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-professional@email.com';
```
3. Navigate to `/admin` to manage inventory, fulfill orders, design new landing pages, and monitor KPIs.

### 4. Stripe Webhook Configuration
1. Go to your **Stripe Dashboard** > **Developers** > **Webhooks**.
2. Add a new endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`.
4. Copy the `Signing Secret` and paste it as `STRIPE_WEBHOOK_SECRET` in your environment variables.

---

## 📁 CORE ARCHITECTURE
```
├── app/                    # Next.js 16 App Router
│   ├── admin/              # The Obsidian Command Center (Dashboard, CMS, Page Builder)
│   ├── shop/               # Product permutations & storefront
│   ├── pages/              # dynamically generated builder pages
│   └── checkout/           # Managed payment flows
├── components/             # High-Aesthetic UI Modules
│   ├── admin/              # Administrative UI
│   └── ui/                 # Tailored React components
├── features/               # Modular business logic units
├── lib/                    # Core Infrastructure
│   ├── actions/            # Server Actions (Atomic Operations)
│   ├── builder/            # Page drag-and-drop mechanics
│   └── supabase/           # Secure DB Clients (Admin/Server/Client)
├── public/                 # Static assets (Logos/Palettes)
├── MASTER.sql              # Unified Database Source of Truth
└── GUIDE.md                # Advanced Operational Playbook
```

---

## 🔐 SECURITY & INTEGRITY
- **Atomic Operations**: Inventory is deducted within database transactions during Stripe confirmation.
- **Server-Only Logic**: Pricing, finance, and stock calculation never happen on the client.
- **RLS Enforced**: Every table is locked behind Supabase Row Level Security.
- **Guest Checkout**: Seamless, secure guest flow with placeholder state management.

---

## 🎨 THE DESIGN CODE
Elite beauty requires elite aesthetics.
- **Background**: Obsidian Black (#000000 / #0B0B0D)
- **Primary Accent**: Liquid Gold (#D4AF37)
- **Typography**: Playfair Display (Luxury Serif), Inter (Modern Sans-Serif)

---

## ⚡ IMAGE OPTIMIZATION & PERFORMANCE
To ensure lightning-fast load times matching the luxury aesthetic:
- **Automatic Optimization**: All product and site images use the Next.js `<Image>` component, which automatically serves them in optimized formats (like WebP).
- **External CDN Priority**: High-res assets (like Dina's portrait) are loaded directly from the Supabase Storage CDN. Because the hostname is registered in `next.config.ts`, Next.js Edge networks instantly cache and optimize the payload globally.
- **Above-The-Fold**: Critical hero and banner images utilize the `priority` flag to pre-load critical CSS and UI.

---

## 🚢 CONTINUOUS INTEGRATION
Pushing code to the `dev` branch triggers a Vercel Preview deployment. Merging to `main` executes a production environment update.

**Current Version 1.0.0 - The Obsidian Standard**
