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
cd mainSmarket
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` file:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email & Shipping
RESEND_API_KEY=re_...
SHIPPO_API_KEY=shippo_test_...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Set up Supabase**

Run the SQL scripts in your Supabase SQL Editor:
```bash
# Main database setup & initialization
SUPABASE_MASTER_SETUP_2026.sql
```

See [SETUP.md](./SETUP.md) for detailed configuration steps.

5. **Create admin user**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

6. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with SSR session
│   ├── admin/             # Admin portal (protected)
│   ├── shop/              # Product pages
│   └── checkout/          # Checkout flow
├── pages/                 # Next.js Pages Router
│   └── api/               # API routes
│       ├── stripe-webhook.ts
│       └── create-checkout.ts
├── components/            # React components
│   ├── admin/            # Admin components
│   └── ui/               # Shadcn UI components
├── lib/                   # Utilities
│   ├── actions/          # Server actions
│   └── utils/            # Helper functions
└── utils/                 # Supabase clients
    └── supabase/
```

## 🔐 Security

- **RLS Policies**: All database tables protected with Row Level Security
- **Server-Side Auth**: Admin routes protected with server-side guards
- **Environment Variables**: Sensitive keys never exposed to client
- **Stripe Webhooks**: Signature verification enforced

## 🎨 Design System

**The Obsidian Palace** - Ultra-minimalist luxury design:
- **Background**: Deep Obsidian (#111111)
- **Accents**: Liquid Gold (#D4AF37)
- **Typography**: Playfair Display (headings), Inter (body)
- **Style**: High-end luxury with plenty of whitespace and refined tokens.

## 📸 Admin Features

- **Product Management**: Create, edit, delete products
- **Image Upload**: Drag & drop or mobile camera/gallery
- **Variant Management**: Multiple sizes, colors, etc.
- **Order Management**: View and fulfill orders
- **User Management**: Manage customer accounts
- **Instant Updates**: Changes appear immediately on live store

## 🛒 Customer Features

- **Product Browsing**: Shop by category or collection
- **Shopping Cart**: Persistent cart with real-time updates
- **Secure Checkout**: Stripe integration
- **Order Tracking**: Email notifications with tracking
- **Responsive Design**: Mobile-first approach

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Deploy to Vercel**
- Connect your GitHub repository
- Add environment variables
- Deploy

3. **Configure Stripe Webhook**
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-domain.com/api/stripe-webhook`
- Select event: `checkout.session.completed`
- Copy webhook secret to Vercel environment variables

## 📚 Documentation

- **Database Schema**: See `supabase-complete-setup.sql`
- **Storage Setup**: See `admin-portal-setup.sql`
- **Environment Variables**: See `.env.example`

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 🔧 Troubleshooting

### Image Upload Issues
1. Verify `product-images` bucket exists in Supabase Storage
2. Check bucket is set to **Public**
3. Verify RLS policies are applied (see `admin-portal-setup.sql`)

### Admin Access Issues
1. Verify user has `role = 'admin'` in profiles table
2. Check browser console for errors
3. Try logging out and back in

### Checkout Issues
1. Verify Stripe keys are correct (test vs live)
2. Check webhook secret matches Stripe Dashboard
3. Monitor Vercel function logs

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase Dashboard logs
3. Check Vercel function logs
4. Verify environment variables

## 📄 License

Private - All rights reserved

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Stripe for payment processing
- Vercel for hosting
