# DINA COSMETIC - The Obsidian Palace

A luxury e-commerce platform built with Next.js 15, Supabase, and Stripe.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router + Pages Router Hybrid)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Storage**: Supabase Storage
- **Email**: Resend
- **Shipping**: Shippo
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Language**: TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Resend account (for emails)
- Shippo account (for shipping)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd commerce
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Set up environment variables**

Create `.env.local` file (use `.env.example` as a template):
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Outbound Communications
RESEND_API_KEY=re_...
SHIPPO_API_KEY=shippo_test_...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Set up Supabase**

Run the **single** master script in your Supabase SQL Editor:
- **File**: `MASTER.sql` — sole source of truth for schema, RLS, indexes, functions, and seed data
- Zero linter warnings (auth_rls_initplan + multiple_permissive_policies fully resolved)
- Idempotent — safe to re-run at any time

5. **Create admin user**

After signing up via the app, run this in the SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@email.com';
```

6. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin portal (protected)
│   ├── shop/              # Product pages
│   └── checkout/          # Checkout flow
├── components/            # React components
│   ├── admin/            # Admin components
│   └── ui/               # Shadcn UI components
├── lib/                   # Shared logic
│   ├── actions/          # Server actions (Mutations)
│   └── utils/            # Helper functions
├── utils/                 # Supabase clients
│   └── supabase/          # Client & Server clients
├── MASTER.sql             # Single source of truth — schema, RLS, functions, seed
├── GUIDE.md               # Complete operations + deployment + admin guide
└── route-guard.ts         # Core server-side security logic (Auth & RBAC)
```

## 🔐 Security

- **Row Level Security (RLS)**: Enforced on all tables with zero public access to logs.
- **Admin Guard**: Server-side role checks and layout protection.
- **Transactions**: Atomic order creation and inventory deduction via RPC.
- **Webhook Verification**: Secure Stripe signature + Idempotency tracking.

## 🎨 Design System

**The Obsidian Palace** - Ultra-minimalist luxury design:
- **Background**: Deep Obsidian (#111111)
- **Accents**: Liquid Gold (#D4AF37)
- **Typography**: Playfair Display (headings), Inter (body)
- **Experience**: Premium micro-animations and smooth transitions.

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Environment Variables**: Add all keys from `.env.local`
4. **Stripe Webhook**: Endpoint: `https://your-domain.com/api/webhooks/stripe`

## 📞 Support

For issues or questions:
1. Verify `product-images` bucket exists in Supabase Storage.
2. Check `role = 'admin'` in the profiles table.
3. Review Vercel and Supabase logs.

## 📄 License

Private - All rights reserved
