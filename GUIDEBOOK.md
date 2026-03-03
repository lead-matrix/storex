# DINA COSMETIC & THE OBSIDIAN PALACE
## Brand & Visual System Operating Guide
**Project Fulfillment:** Professional Stage v1.0 Launch Ready
**Author:** Mahmud R.B from LEAD MATRIX LLC

---

## 1. VISION & VALUE PROPOSITION
**The Obsidian Palace** is more than a store; it is a luxury ecosystem. We have combined high-end cosmetics with lifestyle elements like exclusive talk shows and print-on-demand artisan apparel.

### Core Values Delivered:
- **Exclusivity:** Every pixel is designed with an "Obsidian & Gold" palette, creating a high-fashion editorial feel.
- **Unified Experience:** Seamless transition from shopping for cosmetics to browsing artisanal t-shirts or watching the latest beauty dialogue.
- **Trust & Integrity:** Immutable order history, atomic inventory transactions, and verified Stripe/Shippo integrations.

---

## 2. TECHNOLOGY STACK
We have built a state-of-the-art "Architecture of Elegance" using:
- **Frontend:** Next.js (App Router) with TypeScript for robust, fast performance.
- **Styling:** Vanilla TailwindCSS for pixel-perfect luxury control.
- **Backend:** Supabase (PostgreSQL) for real-time inventory and customer data.
- **Payments:** Stripe (PCI-compliant, secure checkout).
- **Logistics:** Shippo (Automated label generation and tracking).
- **Communications:** Resend (Clean, template-driven transactional emails).

---

## 3. ADMIN PORTAL: COMMAND & CONTROL
The Admin Portal is the "Engine Room" of the brand.

### Accessing the Portal:
1. Log in with **dinaecosmetic@gmail.com**.
2. Navigate to `/admin` to see the dashboard.

### Managing Orders:
- **Order Tracking:** Use the order list to view real-time statuses (Paid, Pending, Shipped).
- **Fulfillment:** Click "View Order" to see shipping details.
- **Shipping Labels:** Use the "Generate Label" feature to purchase and download USPS/UPS labels via Shippo directly from the portal.

### Managing Products:
- **Catalog Control:** Add, edit, or archive products without touching code.
- **Inventory Gatekeeper:** Set stock levels. The system automatically blocks checkout if stock is insufficient to prevent overselling.

---

## 4. CUSTOMER JOURNEY (POV)
The customer enters through a **fixed transparent luxury header** that stays elegant as they scroll.

1. **Discovery:** High-contrast sliding banners showcase the core Cosmetics, the POD Apparel, and the Talk Show.
2. **Seamless Flow:** One-click navigation to focused category grids (Face, Eyes, Lips, Tools).
3. **Checkout:** A smooth, 3-step process (Cart -> Stripe Payment -> Success).
4. **Follow-up:** Automated email from Dina Cosmetics confirms the ritual has begun.

---

## 5. BACKEND MANAGEMENT
- **Automated Webhooks:** Stripe tells the database when payment is successful. No manual intervention is needed for status updates.
- **Database Atomic Integrity:** Order creation and stock deduction happen at the exact same microsecond (Atomic RPC).

---

## 6. MAINTENANCE GUIDE
- **Images:** Always use high-resolution, editorial images. Upload through the Supabase "product-images" bucket for CDN speed.
- **Deployment:** The site is hosted on Vercel. Pushing to the `main` branch automatically deploys the latest version of the Palace.

---
*Created with distinction for Dina Cosmetic by LEAD MATRIX LLC.*
