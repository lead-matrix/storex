# DINA COSMETIC — Upgrade Package
## What's in this build + setup instructions

---

## 📁 Files to Drop Into Your Project

```
app/
  page.tsx                              ← Replace existing homepage
  api/admin/ai-product/route.ts        ← NEW: AI description writer API
  admin/settings/shipping/page.tsx     ← NEW: Shipping rate manager page

components/
  AnnouncementBar.tsx                  ← NEW: Dismissible top bar
  ProductCard.tsx                      ← REPLACE existing ProductCard
  admin/
    AdminLayoutClient.tsx              ← REPLACE existing admin layout
    AIProductWriter.tsx                ← NEW: AI panel for product form
    QuickShip.tsx                      ← NEW: One-click domestic fulfillment
    ShippingRateManager.tsx            ← NEW: Full shipping config UI
  home/
    SplitHero.tsx                      ← NEW: Light-theme split hero
    TrustBar.tsx                       ← NEW: Trust signal bar
    SocialProof.tsx                    ← NEW: Reviews + press logos

styles/
  globals.css                          ← REPLACE existing globals
```

---

## ⚙️ Environment Variables to Add

Add to your `.env.local`:

```env
# Required for AI product writer
ANTHROPIC_API_KEY=sk-ant-api03-...

# Already exists in your config
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🤖 AI Product Writer — How to Use

1. Go to **Admin → Products → New Product** (or edit any product)
2. The "AI Product Assistant" panel appears below the title field
3. Type a product name like "Ruby Velvet Lipstick"
4. Optionally upload a product photo
5. Click **"Write Description"** → Claude writes luxury copy + suggests price
6. Click **"Generate Shades"** → get 6 realistic shade names + hex colors
7. Hit **"Apply"** buttons to auto-fill the form fields

---

## 🚢 Quick Ship — How to Use

In the Orders table, domestic US orders now show a **"Quick Ship (US)"** button.
- Clicks once → auto-fetches Shippo rates → picks cheapest USPS → purchases label → marks shipped
- International orders still show the full FulfillmentRitual flow
- To enable: import `QuickShip` in `app/admin/orders/OrderList.tsx` and replace the Fulfill button for non-international orders

---

## 📦 Shipping Rate Manager

Go to **Admin → Settings → Shipping Rates**

Features:
- Edit flat-rate fallbacks (standard, express, free threshold)
- Weight-based brackets (auto-calculates which tier applies)
- International brackets by region
- Live rate calculator preview — enter weight + subtotal to see what customer pays

---

## 🎨 Homepage Theme Change

The new homepage uses warm white `#FAFAF8` instead of full black.

**To maintain the dark editorial sections** (like the "Obsidian Standard" quote), the homepage
has a single dark section intentionally. This creates contrast — light for products, dark for brand story.

**Admin portal stays dark** — no changes to admin styling.

---

## 🛠️ Integrate AIProductWriter into ProductForm

Add to `components/admin/ProductForm.tsx`:

```tsx
// 1. Import at top
import AIProductWriter from './AIProductWriter'

// 2. Add state
const [titleValue, setTitleValue] = useState(product?.title || '')

// 3. Add onChange to title input
onChange={(e) => {
  setTitleValue(e.target.value)
  if (!slugManual) setSlugValue(generateSlug(e.target.value))
}}

// 4. Add panel below title field
<AIProductWriter
  productTitle={titleValue}
  onApplyDescription={(desc) => {
    // set description field value
    const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement
    if (textarea) {
      textarea.value = desc
      setDescCount(desc.length)
    }
  }}
  onApplyPrice={(price) => {
    const input = document.querySelector('input[name="base_price"]') as HTMLInputElement
    if (input) input.value = price.toString()
  }}
  onApplyVariants={(variants) => {
    setVariants(prev => [...prev, ...variants.map(v => ({
      title: v.name,
      variant_type: 'shade',
      price: v.suggestedPrice || 0,
      compare_price: null,
      stock: 10,
      color_code: v.colorCode,
      image_url: '',
      weight: 0.5,
      _isNew: true,
    }))])
    setShowVariants(true)
  }}
/>
```

---

## 📋 Quick Checklist

- [ ] Replace `styles/globals.css`
- [ ] Replace `app/page.tsx`
- [ ] Replace `components/ProductCard.tsx`
- [ ] Replace `components/admin/AdminLayoutClient.tsx`
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Copy new component files to their paths
- [ ] Add `AnnouncementBar` to `app/layout.tsx` (before `<Header>`)
- [ ] Integrate `AIProductWriter` into `ProductForm.tsx`
- [ ] Add `QuickShip` to `OrderList.tsx` for domestic orders
- [ ] Run `npm run dev` and test

---

## 🔮 What Changes Immediately (No Code Needed)

After dropping in the new `globals.css`:
- Storefront background shifts from black → warm white
- All existing product cards automatically get the new card styling
- Admin portal remains dark (separate CSS scope)

After dropping in the new `page.tsx`:
- Homepage shows SplitHero + TrustBar + SocialProof automatically
- Announcement bar appears above header

---

*Built for DINA COSMETIC — Version 3.0*
