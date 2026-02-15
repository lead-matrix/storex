# 🚀 DEPLOYMENT GUIDE - DINA COSMETIC

## Your Domain: https://dinacosmetic.store

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. ✅ **Environment Variables** (Local)
Your `.env.local` is configured with:
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ⚠️ **NEED**: Service Role Key (get from Supabase Dashboard)
- ⚠️ **NEED**: Stripe Keys
- ⚠️ **NEED**: Resend API Key (for emails)
- ⚠️ **NEED**: Shippo API Key (for shipping)
- ✅ Production URL: `https://dinacosmetic.store`

---

## 🌐 VERCEL DEPLOYMENT STEPS

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `mainSmarket`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 3: Add Environment Variables to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add ALL of these (copy from your `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gnhsorgofzlevtmuuvtd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Shipping
SHIPPO_API_KEY=shippo_live_...

# Site URL
NEXT_PUBLIC_SITE_URL=https://dinacosmetic.store
```

**⚠️ IMPORTANT**: 
- Use **LIVE** keys for production (not test keys)
- Set environment to: **Production**
- Click "Save" after each variable

---

## 🔗 DOMAIN CONFIGURATION

### Step 1: Add Domain to Vercel
1. Go to: **Vercel Dashboard → Your Project → Settings → Domains**
2. Click "Add Domain"
3. Enter: `dinacosmetic.store`
4. Also add: `www.dinacosmetic.store` (optional)

### Step 2: Update DNS Records
Go to your domain registrar (where you bought `dinacosmetic.store`) and add:

**For Apex Domain** (`dinacosmetic.store`):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW** (`www.dinacosmetic.store`):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wait**: DNS propagation can take 24-48 hours (usually faster)

---

## 🎯 STRIPE WEBHOOK CONFIGURATION

### Step 1: Create Production Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://dinacosmetic.store/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"

### Step 2: Get Webhook Secret
1. Click on your new webhook
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 3: Test Webhook
```bash
# Use Stripe CLI to test
stripe listen --forward-to https://dinacosmetic.store/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## 🗄️ SUPABASE CONFIGURATION

### Step 1: Update Allowed URLs
1. Go to: Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://dinacosmetic.store`
   - `https://dinacosmetic.store/auth/callback`
   - `https://www.dinacosmetic.store` (if using www)

### Step 2: Update Site URL
Set **Site URL** to: `https://dinacosmetic.store`

### Step 3: Enable Email Auth
1. Go to: Authentication → Providers
2. Enable "Email"
3. Configure email templates (optional but recommended)

---

## ✅ POST-DEPLOYMENT TESTING

### 1. Test Public Pages
- [ ] Homepage loads: `https://dinacosmetic.store`
- [ ] Shop page works
- [ ] Product pages load
- [ ] About page works

### 2. Test Authentication
- [ ] Sign up works
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works

### 3. Test Admin Portal
- [ ] Can access `/admin` with admin account
- [ ] Dashboard shows stats
- [ ] Can create/edit products
- [ ] Can view orders
- [ ] Can manage users

### 4. Test E-commerce Flow
- [ ] Add product to cart
- [ ] Checkout process works
- [ ] Stripe payment succeeds
- [ ] Order confirmation email sent
- [ ] Order appears in admin panel
- [ ] Stock decrements correctly

### 5. Test Mobile
- [ ] Site is responsive
- [ ] Navigation works
- [ ] Checkout works on mobile

---

## 🔒 SECURITY CHECKLIST

- [ ] Service role key is ONLY in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies are enabled in Supabase
- [ ] Admin routes are protected by middleware
- [ ] HTTPS is enforced (no HTTP)
- [ ] CORS is properly configured

---

## 📊 MONITORING & ANALYTICS

### Vercel Analytics
Already included! Check:
- Vercel Dashboard → Your Project → Analytics

### Error Tracking (Optional)
Consider adding:
- **Sentry**: https://sentry.io
- **LogRocket**: https://logrocket.com

---

## 🚨 TROUBLESHOOTING

### Issue: "Module not found" errors
**Solution**: Redeploy with:
```bash
vercel --prod --force
```

### Issue: Environment variables not working
**Solution**: 
1. Check they're added in Vercel dashboard
2. Redeploy after adding variables
3. Make sure they're set for "Production" environment

### Issue: Webhook not receiving events
**Solution**:
1. Check webhook URL is correct
2. Verify webhook secret in Vercel
3. Check Stripe dashboard → Webhooks → Logs

### Issue: Admin can't access /admin
**Solution**:
1. Check user has `role = 'admin'` in Supabase `profiles` table
2. Verify middleware is working
3. Check browser console for errors

---

## 🎉 YOU'RE LIVE!

Once deployed, your site will be available at:
- **Main**: https://dinacosmetic.store
- **WWW**: https://www.dinacosmetic.store (if configured)

**Next Steps**:
1. Add real product data
2. Upload product images
3. Test everything thoroughly
4. Share with the world! 🚀

---

## 📞 SUPPORT

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console
3. Check Supabase logs
4. Check Stripe webhook logs

**Good luck with your launch! 🎊**
