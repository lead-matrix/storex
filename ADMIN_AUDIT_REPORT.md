# STOREX ADMIN CONTROL AUDIT
## Date: April 26, 2026
## Audited by: PS Agent — Full codebase read

---

## OVERALL SCORE: 74/100

### Breakdown:
- Frontend Control:     68/100
- Backend Control:      82/100
- Admin UX Design:      78/100
- Data Ownership:       80/100
- Missing Features:     -14 pts

---

## WHAT ADMIN FULLY CONTROLS (✅ Working, verified)

### Orders (95/100)
- View all orders with status filter tabs (All/Pending/Paid/Shipped/Cancelled/Refunded)
- Change order status via dropdown (inline)
- Generate shipping label (Shippo integration)
- Reprint label (fetches already-purchased label PDF)
- Export all orders to CSV
- Batch fulfill multiple orders at once
- View order details (modal: items, address, tracking, fulfillment)
- Unfulfilled badge on sidebar (live count, auto-refreshes)
- Webhook-driven: payment → auto-creates order record

### Products (90/100)
- Add/edit/delete products
- Toggle active/inactive (live on storefront instantly)
- Set featured / bestseller / on_sale / is_new flags
- Weight (oz), dimensions (length/width/height) per product
- Sale price + compare price fields
- Upload multiple product images
- Variants with independent price + stock per variant
- Stock +/- buttons on products page (inline, no page reload)
- Low stock dashboard alert (under 10 units per variant)
- Export products to CSV
- Bulk import products via CSV
- Catalog spreadsheet view (inline cell editing)

### Categories (90/100)
- Create/edit/delete categories
- Category cover image
- Slug (becomes /collections/[slug] URL)
- Categories drive Shop page and navigation

### CMS Pages (85/100)
- Edit any page: Home, About, Contact, Sale, Privacy, Terms
- 7 block types: Hero Banner, Image Banner, Product Grid, Philosophy Grid, Video Showcase, Rich Text, Contact Form
- Drag-to-reorder blocks
- Image upload inside block editor (any *url field shows uploader)
- Publish instantly (no redeploy)
- New page creation

### Media Library (88/100)
- Upload images (drag+drop, multi-file, auto-compressed to WebP)
- Copy CDN URL
- Delete images
- Grid/list view toggle
- Content blocks editor (hero_title, hero_subtitle, hero_cta_text, hero_cta_link, bestseller_heading, bestseller_subheading, brand_story_heading, brand_story_body, newsletter_heading, newsletter_subheading)

### Videos (85/100)
- Upload videos (Mux)
- Status tracking (Processing → Ready via webhook)
- Use in CMS Video blocks
- Delete video records

### Analytics (82/100)
Tab 1 — Revenue Intelligence:
- Gross revenue, shipping revenue, AOV, total customers
- 7-day sales line chart
- 30-day revenue trend
- Top selling products by units (with % share bars)

Tab 2 — Live Web Analytics:
- Active visitors right now (5-min window, auto-refresh 30s)
- Today's page views (24h)
- Interactive globe map (country dots, hover to see name+count)
- Top pages with progress bars (7-day)
- Device breakdown (desktop/mobile/tablet %)
- Traffic sources (referrer domains)
- 7-day sparkline chart

### Marketing (80/100)
- Create coupon codes (percentage or fixed)
- Set min purchase, max uses, expiry date
- Toggle coupon active/inactive
- Delete coupons
- Abandoned cart list (recovery rate shown)
- Send recovery email per cart (one-click)
- Delete abandoned cart records

### Email Settings (88/100)
- Brand name, tagline, accent color, background color, text color
- Order confirmation: subject, greeting, body, label
- Shipping notification: subject, greeting, body, label
- Send test email (to admin email)
- Live preview of email template

### Settings (85/100)
- Store name, tagline, currency
- Store kill switch (maintenance mode)
- Announcement bar messages (multi-message rotating)
- Social links: Instagram, TikTok, Facebook
- Navigation menus (header + footer)
- Shipping rates (4 types × weight brackets)
- Free shipping threshold
- Home page curation (bestsellers hero toggle, bestseller section heading)

### Customers/Users (75/100)
- View all customers + guests with real orders
- LTV and order count per customer
- Segment filtering (All, VIP, Standard, Lead)
- Search by name or email
- Grant/revoke admin role

### Dashboard (80/100)
- Gross revenue (all-time), active orders, product count, low inventory count
- Today's revenue in sidebar (updates every 30 seconds)
- Unfulfilled orders badge on Orders nav link
- Recent orders list
- Low stock variant alerts with links to fix
- Quick actions: New Product, View Orders

### Global Admin Features
- Admin search (searches products, orders, users simultaneously)
- Mobile-responsive admin layout
- "View Live Store" link in sidebar (opens in new tab)
- How to Use guide (16 sections, accordion)

---

## WHAT IS NOT CONTROLLED / HARDCODED (❌ Gaps)

### 1. Trust Bar — HARDCODED (0% admin control)
Text on the 4 trust signals is fixed in code:
- "Secure Checkout / 256-bit SSL encryption"
- "Free Shipping $75+"
- "30-Day Returns / Hassle-free guarantee"
- "4.9/5 Stars / From 247+ reviews"
Admin cannot change any of this without a developer.

### 2. Social Proof / Reviews Section — HARDCODED (0% admin control)
3 customer reviews (Sarah M., Amira K., Priya R.) are hardcoded in SocialProof.tsx.
The star count (247 reviews, 4.9 rating) is also hardcoded.
Admin cannot add, edit, or remove reviews without a developer.

### 3. Editorial Quote Section — HARDCODED (0% admin control)
"The Obsidian Standard" section with the italic quote
"Beauty is the illumination of your soul" and the "Our Story" CTA
are hardcoded directly in page.tsx.

### 4. Newsletter Subscribers — NO ADMIN VIEW
Customers subscribe via the newsletter form.
Their emails are saved to newsletter_subscribers table in Supabase.
But there is NO admin page to view, export, or email these subscribers.
Admin is collecting emails they can never access from the admin portal.

### 5. Hero Slides — PARTIAL CONTROL
SplitHero reads from frontend_content → hero_slides.
But the DEFAULT_SLIDE (fallback) is hardcoded in the component.
The media library content blocks editor covers: hero_title, hero_subtitle, hero_cta_text, hero_cta_link.
But slide IMAGES and the rating/reviewCount shown on the hero are hardcoded defaults.

### 6. No Stripe Refund from Admin UI
The backend API route /api/admin/refund-label exists (refunds a Shippo label).
But there is NO UI button in the order modal to trigger a Stripe payment refund.
Admin must go to Stripe Dashboard manually for money refunds.

### 7. Social Links Incomplete in Settings
Settings only has: Instagram, TikTok, Facebook.
Missing: YouTube, Pinterest (shown in footer design but not in settings form).
Admin cannot update YouTube/Pinterest links from admin panel.

### 8. No Order Notes / Internal Admin Notes
Admin cannot add internal notes to an order (e.g. "Customer called, wants gift wrap").
No way to flag, star, or annotate orders.

### 9. No Customer Messaging
No way to send a custom email to a specific customer directly from admin.
(Only recovery emails for abandoned carts and automatic order/shipping emails.)

### 10. Home Page Sections — LIMITED CONTROL
Admin can toggle: "show_bestsellers_hero" and "show_bestsellers".
But cannot toggle or reorder: TrustBar, SocialProof, Editorial section, NewsletterSection.
These are always on. Admin has no control over their visibility.

### 11. Sidebar.tsx is a DEAD DUPLICATE
/components/admin/Sidebar.tsx exists and is out of date (missing Marketing, Media, Videos, Customers, How to Use).
The REAL sidebar is AdminLayoutClient.tsx.
Sidebar.tsx is imported nowhere — it's dead code.

---

## WHAT WOULD MAKE ADMIN MUCH HAPPIER

### PRIORITY 1 — Quick wins (1-2 hours each)

1. **Newsletter Subscribers Page**
   /admin/marketing → add a "Subscribers" tab.
   Shows all emails from newsletter_subscribers table.
   Export to CSV button. Total count shown.

2. **YouTube + Pinterest in Social Settings**
   Add 2 more input fields to the settings form.
   Feed them into the footer component.

3. **Stripe Refund Button in Order Modal**
   Add "Issue Refund" button in the order detail modal.
   Calls a backend endpoint → Stripe API → marks order "refunded".
   Currently only possible via Stripe dashboard.

4. **Trust Bar — Make Editable**
   Move 4 trust bar items into site_settings or frontend_content.
   Admin can set the text for each of the 4 signals.
   (Free Shipping threshold, return policy days, rating, review count)

5. **Delete Dead Sidebar.tsx**
   Remove /components/admin/Sidebar.tsx — it's dead code that will confuse any developer.

### PRIORITY 2 — Medium impact

6. **Customer Reviews Management**
   /admin/marketing → "Reviews" tab.
   Admin can add/edit/delete reviews shown in SocialProof.
   Stored in Supabase. SocialProof fetches from DB instead of being hardcoded.
   This is big for brand credibility management.

7. **Editorial Section Editable**
   The "Obsidian Standard" quote section on homepage should be editable
   via frontend_content table. Admin sets the quote and CTA link from Media → Content Blocks.

8. **Order Internal Notes**
   A text field in each order for admin-only internal notes.
   Saved to orders.admin_notes column.
   "Handle with care", "VIP customer", "Replacement for order #XXX"

9. **Home Section Visibility Toggles**
   Add toggles to Settings → Home Page Curation for:
   - Show/hide TrustBar
   - Show/hide SocialProof section
   - Show/hide Editorial Quote section
   - Show/hide Newsletter Section

### PRIORITY 3 — Power features

10. **Send Custom Email to Customer**
    In the customer profile or order modal, an "Email Customer" button.
    Admin types a subject + message, sends via Resend.
    Use the existing email template styling.

11. **Hero Slide Manager**
    A dedicated visual editor for the homepage hero slides.
    Admin adds/removes/reorders slides with image + title + subtitle + CTA per slide.
    Currently partially hooked up but not surfaced in admin UI cleanly.

12. **Low Stock Auto-Alert via Email**
    When any variant drops below 5 units, automatically email the admin.
    This is a server-side automation — no user action needed, runs on webhook.

13. **Coupon Performance Dashboard**
    Show: how many times each coupon was used, total revenue attributed, conversion rate.
    Currently coupons exist but their impact on revenue is invisible.

14. **Revenue by Product/Category Breakdown**
    Analytics currently shows top products by units.
    Add: revenue per product (not just units), and revenue per category.
    Helps know which categories are actually profitable.

---

## SUMMARY SCORE CARD

| Area                          | Score | Verdict                              |
|-------------------------------|-------|--------------------------------------|
| Orders & Fulfillment          | 95/100 | ✅ Excellent                         |
| Products & Catalog            | 90/100 | ✅ Very strong                       |
| CMS & Content Editing         | 85/100 | ✅ Good — hero/reviews still hardcoded|
| Email & Notifications         | 88/100 | ✅ Strong                            |
| Analytics                     | 82/100 | ✅ Good — no product revenue breakdown|
| Marketing & Coupons           | 80/100 | 🟡 Good — no subscriber view         |
| Settings & Configuration      | 85/100 | 🟡 Good — missing YT/Pinterest       |
| Customer Management           | 75/100 | 🟡 Decent — no direct messaging      |
| Frontend Customization        | 68/100 | 🔴 Gaps — trust bar/reviews hardcoded|
| Admin UX Design               | 78/100 | 🟡 Good — dead Sidebar.tsx issue     |

**OVERALL: 74/100**
The admin owns the business operations end-to-end.
The main gap is frontend design elements that are hardcoded and need dev changes.
Fix the Priority 1 items and the score jumps to ~85/100 immediately.
Fix Priority 2 and it hits ~92/100.
