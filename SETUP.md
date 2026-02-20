# DINA COSMETIC | Setup Guide

This document provides instructions for initializing and configuring the **Obsidian Palace** e-commerce platform.

## 🛠️ Database Setup (Supabase)

1.  **Initialize Database**:
    Go to your [Supabase SQL Editor](https://app.supabase.com/) and execute the contents of:
    `SUPABASE_MASTER_SETUP_2026.sql`
    
    This will:
    - Create all necessary tables (`products`, `profiles`, `orders`, etc.).
    - Configure Row Level Security (RLS) policies.
    - Set up automatic profile creation on user signup.
    - Seed the database with initial categories and theme settings.

2.  **Grant Admin Rights**:
    To access the admin portal, run this SQL for your specific email:
    ```sql
    UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
    ```

3.  **Storage Configuration**:
    Create a **Public** bucket in Supabase Storage named:
    `product-images`
    
    Ensure the following RLS policies are applied to the `storage.objects` table:
    - **Select**: Public Access (anon/authenticated).
    - **Insert/Update/Delete**: Admins Only (`EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`).

## 🔑 Environment Variables

Create a `.env.local` file with the following keys:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration (Payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Third-Party Services
RESEND_API_KEY=re_...
SHIPPO_API_KEY=shippo_test_...

# General
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🎨 Design System

The platform uses the **DINACOSMETIC Color System**:
- **Background**: `bg-background-primary` (#111111)
- **Accents**: `bg-gold-primary` (#D4AF37)
- **Typography**: Playfair Display (Serif Headings), Inter (Sans Body)

## 🚀 Development & Deployment

1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Build**: `npm run build`
4.  **Deploy**: Connect GitHub to Vercel and map the environment variables.

---
*For support or architectural inquiries, refer to the documentation in the `.agent/` directory.*
