/**
 * /admin/guide — Complete A-to-Z operations manual for the store owner.
 * No database queries required. Pure static content.
 */

'use client'

import { useState } from 'react'
import {
    ClipboardList, ShoppingCart, Package, Truck, Mail,
    Settings, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
    BookOpen, HelpCircle, LayoutGrid, BarChart2, Users, Video,
    Image as ImageIcon, Tag, Megaphone, Share2, Globe, Zap,
    AlertTriangle, FileText, Key, RefreshCw
} from 'lucide-react'

const sections = [
    {
        id: 'daily',
        icon: ClipboardList,
        color: 'text-gold',
        bgColor: 'bg-gold/10 border-gold/20',
        title: 'Daily Operations Checklist',
        subtitle: 'What to do every morning',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Run through this checklist every morning to keep the store running smoothly.
                </p>
                <div className="space-y-3">
                    {[
                        {
                            step: '1',
                            title: 'Check for new paid orders',
                            description: 'Go to Orders page. Look for any orders with status "Paid" and fulfillment status "Unfulfilled". The orange badge on the Orders link in the sidebar shows how many need attention.',
                            color: 'border-gold/30 bg-gold/5',
                            labelColor: 'text-gold',
                        },
                        {
                            step: '2',
                            title: 'Generate shipping labels',
                            description: 'For each paid + unfulfilled order: click the order row → click "View Details" → click "Generate Shipping Label". Select the shipping rate and confirm. The label PDF downloads automatically and the tracking number is saved.',
                            color: 'border-emerald-500/30 bg-emerald-500/5',
                            labelColor: 'text-emerald-400',
                        },
                        {
                            step: '3',
                            title: 'Print and ship',
                            description: 'Download the label PDF and print it. Stick it on the package and hand it to your carrier (USPS drop-off or scheduled pickup). The tracking number is automatically emailed to the customer.',
                            color: 'border-purple-500/30 bg-purple-500/5',
                            labelColor: 'text-purple-400',
                        },
                        {
                            step: '4',
                            title: 'Watch for stale pending orders',
                            description: 'Check for "Pending" orders older than 24 hours — these may indicate a payment that failed silently. Verify in Stripe Dashboard. Cancel stale pending orders to keep your dashboard clean.',
                            color: 'border-red-500/30 bg-red-500/5',
                            labelColor: 'text-red-400',
                        },
                        {
                            step: '5',
                            title: 'Check abandoned carts',
                            description: 'Go to Marketing → Abandoned Carts. For any carts with a customer email that are more than a few hours old, consider sending a recovery email. It only takes one click per cart.',
                            color: 'border-lime-500/30 bg-lime-500/5',
                            labelColor: 'text-lime-400',
                        },
                    ].map(item => (
                        <div key={item.step} className={`flex gap-4 p-4 rounded-xl border ${item.color}`}>
                            <div className={`w-7 h-7 rounded-full border ${item.color} flex items-center justify-center flex-shrink-0 ${item.labelColor} text-[11px] font-black`}>
                                {item.step}
                            </div>
                            <div>
                                <p className={`text-[12px] font-bold uppercase tracking-wider ${item.labelColor}`}>{item.title}</p>
                                <p className="text-white/60 text-[12px] mt-1 leading-relaxed">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'orders',
        icon: ShoppingCart,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        title: 'How Orders Work',
        subtitle: 'From cart to doorstep — complete lifecycle',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Here is the complete lifecycle of an order, from the moment a customer clicks "Buy" to delivery.
                </p>
                <div className="relative pl-6 space-y-0">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
                    {[
                        { label: 'Status: Pending', title: 'Customer starts checkout', desc: 'An order is created in your database with status "Pending". Stripe opens the payment page.', color: 'bg-amber-500' },
                        { label: 'Status: Paid', title: 'Payment succeeds', desc: 'Stripe processes the card. A webhook fires to your store, which marks the order "Paid" and records the customer\'s address, phone, and line items automatically. The customer receives an order confirmation email.', color: 'bg-emerald-500' },
                        { label: 'Action Required', title: 'You generate a shipping label', desc: 'From Orders, open the order → "Generate Shipping Label". The system contacts Shippo, calculates the weight-based rate, and purchases a label. The tracking number is saved to the order.', color: 'bg-gold' },
                        { label: 'Email Sent', title: 'Customer gets shipping notification', desc: 'The moment a label is generated, an email with the tracking number goes out automatically via Resend.', color: 'bg-purple-500' },
                        { label: 'Done', title: 'Order fulfilled', desc: 'Once all items have labels, fulfillment status updates to "Fulfilled". No further action required.', color: 'bg-blue-500' },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 pb-6 last:pb-0">
                            <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0 mt-1 relative z-10 -ml-1.5`} />
                            <div>
                                <span className={`text-[9px] font-black uppercase tracking-luxury px-2 py-0.5 rounded-full ${item.color}/20 text-white/60 border border-white/10`}>
                                    {item.label}
                                </span>
                                <p className="text-white text-[12px] font-bold mt-2">{item.title}</p>
                                <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">If an order stays Pending after payment</p>
                        <p className="text-white/60 text-[12px] mt-1 leading-relaxed">
                            This means the Stripe webhook may have failed. Go to Stripe Dashboard → Developers → Webhooks → select your endpoint → find the failed event → click "Resend". The order will update automatically.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'products',
        icon: Package,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        title: 'Managing Products',
        subtitle: 'Add, edit, stock, and organize your catalog',
        content: (
            <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">How to add a new product</p>
                    {[
                        { num: '01', title: 'Products → Add New Product', desc: 'Click the gold "Add New Product" button in the top right.' },
                        { num: '02', title: 'Fill in the basics', desc: 'Title (required), Description, Base Price (required), SKU. The URL slug is auto-generated from the title.' },
                        { num: '03', title: 'Set the weight — critical for shipping', desc: 'Enter the product weight in ounces (oz). This is used to calculate shipping at checkout. Weigh the packaged product with its packaging. If left blank, defaults to 2oz which may make shipping prices wrong.' },
                        { num: '04', title: 'Upload product images', desc: 'Upload at least one image. First image is the main product photo. Images are served via CDN.' },
                        { num: '05', title: 'Set stock quantity', desc: 'Enter how many units you have. Stock decrements automatically when orders are placed. Adjust later with the +/- buttons on the Products page.' },
                        { num: '06', title: 'Add variants (optional)', desc: 'If the product comes in different options (Shade 01, Shade 02), click "Add Variant". Each variant has its own price override and stock level.' },
                        { num: '07', title: 'Set to Active and Save', desc: 'Toggle status to "Active" when ready for customers. Click Save — product appears instantly, no redeploy needed.' },
                    ].map(item => (
                        <div key={item.num} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <span className="text-[11px] font-black text-blue-400/60 font-mono w-6 flex-shrink-0">{item.num}</span>
                            <div>
                                <p className="text-white text-[12px] font-bold">{item.title}</p>
                                <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 space-y-2">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Managing stock</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        On the Products page, each product row has + and - buttons to adjust stock directly. You can also type a specific quantity in the input field. Stock changes are logged in <code className="bg-white/10 px-1 rounded text-[11px]">inventory_logs</code> for audit purposes.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 space-y-2">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Product badges</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Toggle "Is New" to show a NEW badge on the product card. Toggle "Is Bestseller" to show a BESTSELLER badge and include it in bestseller filters. Toggle "On Sale" and set a Sale Price to show the original crossed-out price and the sale badge.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'categories',
        icon: LayoutGrid,
        color: 'text-fuchsia-400',
        bgColor: 'bg-fuchsia-500/10 border-fuchsia-500/20',
        title: 'Categories & Collections',
        subtitle: 'Organize your product catalog',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Categories are what customers browse in your shop. Each category shows up in navigation and the shop filter tabs.
                </p>
                {[
                    { icon: '🗂️', title: 'Create a category', desc: 'Admin → Categories → Add Category. Give it a name, slug (auto-generated), description, and a cover image. The cover image appears as the hero background on the collection page.' },
                    { icon: '🔗', title: 'Assign products to categories', desc: 'When creating or editing a product, select its category from the dropdown. A product can only belong to one category.' },
                    { icon: '🖼️', title: 'Category cover images', desc: 'Recommended size: 1200×1500px (4:5 ratio). Upload via Media Library first, then paste the URL into the category image field.' },
                    { icon: '⚡', title: 'Live updates', desc: 'Category changes go live immediately — no redeploy needed. The shop page and navigation update in real time.' },
                ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-white text-[12px] font-bold">{item.title}</p>
                        <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'cms',
        icon: FileText,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/20',
        title: 'CMS Pages (Experiences)',
        subtitle: 'Build and edit any page without code',
        content: (
            <div className="space-y-6">
                <p className="text-white/60 text-sm leading-relaxed">
                    The CMS lets you edit every page on the storefront — Home, About, Contact, Privacy, Terms, Sale — without touching any code. Changes go live immediately.
                </p>
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">How to edit a page</p>
                    {[
                        { num: '01', title: 'Go to Admin → CMS Pages (Experiences)', desc: 'You\'ll see a list of all live pages. Click the pencil icon to edit any page.' },
                        { num: '02', title: 'Add or reorder blocks', desc: 'Click "Add Block" to insert a new content section. Drag the handle to reorder blocks. Each block type has its own settings panel.' },
                        { num: '03', title: 'Edit block content', desc: 'Click any block to select it. The right panel shows all editable fields — text, images, links, colors. Changes preview instantly in the center panel.' },
                        { num: '04', title: 'Save and publish', desc: 'Click "Save & Publish" to push changes live. The page updates immediately with no deployment.' },
                    ].map(item => (
                        <div key={item.num} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <span className="text-[11px] font-black text-rose-400/60 font-mono w-6 flex-shrink-0">{item.num}</span>
                            <div>
                                <p className="text-white text-[12px] font-bold">{item.title}</p>
                                <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Available block types</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { name: 'Hero Banner', desc: 'Full-width hero with background image, heading, subtext, and up to 3 slider images.' },
                            { name: 'Image Banner', desc: 'Single large image with optional overlay text and a CTA button.' },
                            { name: 'Philosophy Grid', desc: 'Icon + title + description grid. Great for brand values or benefits sections.' },
                            { name: 'Product Grid', desc: 'Displays a live grid of featured products from the database.' },
                            { name: 'Video Block', desc: 'Full-width Mux video player with autoplay/loop.' },
                            { name: 'Rich Text', desc: 'Pure text content — paragraphs, headings, bullet points.' },
                            { name: 'Contact Form', desc: 'Pre-built contact form section with email submission.' },
                        ].map(block => (
                            <div key={block.name} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                                <p className="text-white text-[11px] font-bold">{block.name}</p>
                                <p className="text-white/40 text-[11px] mt-1">{block.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Recommended image sizes</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Product Gallery', size: '1080 × 1440 px', ratio: '3:4 vertical' },
                            { label: 'Hero Banner / Video', size: '1920 × 1080 px', ratio: '16:9 landscape' },
                            { label: 'Category Cover', size: '1200 × 1500 px', ratio: '4:5 portrait' },
                            { label: 'Image Banner', size: '1920 × 800 px', ratio: 'Wide landscape' },
                        ].map(img => (
                            <div key={img.label} className="bg-white/5 border border-white/[0.06] rounded-xl p-3">
                                <p className="text-white text-[11px] font-bold">{img.label}</p>
                                <p className="text-rose-400 font-mono text-sm mt-1">{img.size}</p>
                                <p className="text-white/40 text-[10px]">{img.ratio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'media',
        icon: ImageIcon,
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/10 border-teal-500/20',
        title: 'Media Library',
        subtitle: 'Manage all your images in one place',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    The Media Library at <code className="bg-white/10 px-1 rounded text-[11px]">/admin/media</code> is the central vault for every image on the store. Always upload images here first, then use the URL in products, CMS pages, or categories.
                </p>
                {[
                    { icon: '⬆️', title: 'Uploading images', desc: 'Click "Upload Images" or drag and drop files onto the upload zone. Multiple files can be uploaded at once. Supported: JPG, PNG, WEBP. Max 10MB per file. Images are compressed automatically.' },
                    { icon: '🔗', title: 'Getting the URL', desc: 'Click any image to select it. Click the "Copy URL" button. The CDN URL is now in your clipboard — paste it into any product image field, CMS block, or category cover.' },
                    { icon: '🗑️', title: 'Deleting images', desc: 'Select an image and click the trash icon. Note: deleted images that are already used in products or pages will show as broken images — always check before deleting.' },
                    { icon: '🔲', title: 'Grid vs List view', desc: 'Toggle between grid view (visual) and list view (filenames + dates) using the view buttons in the top right of the library.' },
                ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-white text-[12px] font-bold">{item.title}</p>
                        <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'videos',
        icon: Video,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/20',
        title: 'Video Library (Mux)',
        subtitle: 'Upload and manage video content',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Videos are managed at <code className="bg-white/10 px-1 rounded text-[11px]">/admin/videos</code>. They use Mux for professional transcoding and HLS streaming — your videos will play instantly on any device, even on slow connections.
                </p>
                {[
                    { icon: '🎬', title: 'Upload a video', desc: 'Click "Upload Video", give it a title, and select your MP4 or MOV file. Max size: 500MB. After upload, Mux starts transcoding — this takes 1–3 minutes. The status shows "Processing" during this time.' },
                    { icon: '✅', title: 'Video becomes "Ready"', desc: 'Once Mux finishes processing, the status automatically changes to "Ready" via webhook. You don\'t need to refresh — it updates itself. The video is now available to use in CMS pages.' },
                    { icon: '📺', title: 'Using the video in CMS', desc: 'In the CMS block editor, add a "Video Block". The block will let you select from your uploaded Mux videos. The video plays auto-muted and loops on the storefront for a cinematic experience.' },
                    { icon: '⚠️', title: 'If a video stays "Processing" for more than 10 minutes', desc: 'Check the Mux Dashboard → Assets for the upload. If it shows an error, delete the video record and re-upload the file. Ensure the file is not corrupted.' },
                ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-white text-[12px] font-bold">{item.title}</p>
                        <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'analytics',
        icon: BarChart2,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10 border-indigo-500/20',
        title: 'Analytics & Performance',
        subtitle: 'Track revenue, orders, and top products',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to <code className="bg-white/10 px-1 rounded text-[11px]">/admin/analytics</code> for full reporting. The dashboard sidebar also shows today's real-time revenue updated every 30 seconds.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: '💰', title: 'Revenue Chart', desc: 'Daily gross revenue for the last 7 or 30 days. Switch between views with the toggle.' },
                        { icon: '📦', title: 'Top Products', desc: 'Which products are selling the most units. Useful for knowing when to restock.' },
                        { icon: '🛒', title: 'Order Volume', desc: 'Number of completed orders per day. Helps you spot slow periods and busy days.' },
                        { icon: '📊', title: 'Live Dashboard KPIs', desc: 'The main admin dashboard shows today\'s revenue, total unfulfilled count, and low-stock product alerts.' },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <p className="text-white text-[12px] font-bold">{item.title}</p>
                            <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'marketing',
        icon: Tag,
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/10 border-lime-500/20',
        title: 'Marketing & Coupons',
        subtitle: 'Discount codes and abandoned cart recovery',
        content: (
            <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Creating a coupon code</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to <code className="bg-white/10 px-1 rounded text-[11px]">/admin/marketing</code>. Click "Add Coupon". Fill in:
                    </p>
                    {[
                        { field: 'Code', desc: 'The code customers type at checkout (e.g. WELCOME20). Will be auto-uppercased.' },
                        { field: 'Discount Type', desc: '"Percentage" (e.g. 20% off) or "Fixed Amount" (e.g. $10 off).' },
                        { field: 'Discount Value', desc: 'The amount. For percentage: enter 20 for 20%. For fixed: enter 10 for $10 off.' },
                        { field: 'Minimum Purchase', desc: 'Optional. Customer must spend at least this amount for the code to work.' },
                        { field: 'Max Uses', desc: 'Optional. The code deactivates after this many uses. Leave blank for unlimited.' },
                        { field: 'Expiry Date', desc: 'Optional. The code stops working after this date.' },
                    ].map(item => (
                        <div key={item.field} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.06]">
                            <p className="text-lime-400 text-[11px] font-bold w-28 flex-shrink-0">{item.field}</p>
                            <p className="text-white/50 text-[12px]">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Abandoned Cart Recovery</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to <code className="bg-white/10 px-1 rounded text-[11px]">/admin/marketing/abandoned</code>. This shows carts that were started but never completed checkout. For each cart with an email address, click "Send Recovery Email" to send them a personalized email with a one-click recovery link. This is one of the highest-ROI actions you can take daily.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'email',
        icon: Mail,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10 border-pink-500/20',
        title: 'Email Notifications',
        subtitle: 'Automatic transactional emails via Resend',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Two emails send automatically — no configuration needed for them to work. You can customize their appearance from <code className="bg-white/10 px-1 rounded text-[11px]">/admin/email</code>.
                </p>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <p className="text-white text-[12px] font-bold">Order Confirmation Email</p>
                        </div>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                            Sent automatically when Stripe confirms payment. Contains the order ID, items purchased, shipping address, and total.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-purple-400" />
                            <p className="text-white text-[12px] font-bold">Shipping Notification Email</p>
                        </div>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                            Sent automatically when you generate a shipping label. Contains the tracking number so the customer can track their package.
                        </p>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">If emails aren't sending:</p>
                    <ol className="space-y-1.5 text-white/60 text-[12px]">
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">1.</span> Check <code className="bg-white/10 px-1 rounded text-[11px]">RESEND_API_KEY</code> is set in Vercel environment variables.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">2.</span> Check Vercel → Functions tab for errors containing <code className="bg-white/10 px-1 rounded text-[11px]">[Stripe Webhook] email failed</code>.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">3.</span> In your Resend dashboard, verify your sending domain is active and the "from" address matches.</li>
                    </ol>
                </div>
            </div>
        )
    },
    {
        id: 'shipping',
        icon: Truck,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/20',
        title: 'Shipping Rate Configuration',
        subtitle: 'Weight-based, admin-configurable, live rates',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Shipping rates are weight-based and fully configurable from <code className="bg-white/10 px-1 rounded text-[11px]">Settings → Shipping Rates</code>. Changes take effect immediately at checkout.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: '⚖️', title: 'How rates are calculated', desc: 'The system adds up the weight (oz) of every item in the cart and finds the matching weight bracket. You set the bracket amounts.' },
                        { icon: '🚚', title: '4 rate types', desc: 'Standard Domestic, Express Domestic, Standard International, Express International. Customers choose at checkout.' },
                        { icon: '🎁', title: 'Free shipping threshold', desc: 'Set a minimum order amount for free standard shipping. Leave at $0 to disable. Visible to customers as a promo banner.' },
                        { icon: '⚠️', title: 'Always set product weights', desc: 'If a product has no weight set, it defaults to 2oz. This undercharges shipping on heavier packages — always weigh packaged products.' },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <p className="text-white text-[12px] font-bold">{item.title}</p>
                            <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'settings',
        icon: Settings,
        color: 'text-white/60',
        bgColor: 'bg-white/5 border-white/10',
        title: 'Settings Reference',
        subtitle: 'Complete guide to every settings section',
        content: (
            <div className="space-y-3">
                {[
                    {
                        title: 'Brand & General',
                        path: '/admin/settings#section-general',
                        desc: 'Store name, tagline, currency, and logo. The logo is used in the header/footer across the entire storefront. You can upload via Media Library or paste a URL directly.',
                        icon: '🏪',
                    },
                    {
                        title: 'Store Kill Switch',
                        path: '/admin/settings#section-general',
                        desc: 'Toggle "Store Status" to put the storefront in maintenance mode. Customers see a maintenance page. Admin portal still works normally. Use this during large stock updates or site changes.',
                        icon: '🔴',
                    },
                    {
                        title: 'Announcement Bar',
                        path: '/admin/settings#section-announcement',
                        desc: 'The scrolling banner at the top of every page. Enter multiple messages (one per line) and they rotate automatically. No redeploy needed — changes go live in seconds.',
                        icon: '📣',
                    },
                    {
                        title: 'Social Media Links',
                        path: '/admin/settings#section-menus',
                        desc: 'Set the full URLs for Instagram, TikTok, YouTube, Pinterest, and Facebook. These appear as icons in the footer. Update anytime — no redeploy needed.',
                        icon: '📱',
                    },
                    {
                        title: 'Navigation Menus',
                        path: '/admin/settings#section-menus',
                        desc: 'Edit the header navigation and footer link lists. Add, remove, or reorder links. The menu editor shows a live preview of your navigation structure.',
                        icon: '🧭',
                    },
                    {
                        title: 'Shipping Rates',
                        path: '/admin/settings/shipping',
                        desc: 'All weight brackets for Standard, Express, International Standard, and International Express shipping. Also configure your free shipping threshold and minimum order for free shipping.',
                        icon: '📦',
                    },
                    {
                        title: 'Email Settings',
                        path: '/admin/email',
                        desc: 'Customize the subject lines, body text, and accent color for the order confirmation and shipping notification emails. Changes apply to all future emails instantly.',
                        icon: '✉️',
                    },
                    {
                        title: 'CMS Pages (Experiences)',
                        path: '/admin/cms',
                        desc: 'Edit the content of any storefront page using the drag-and-drop block editor. The Home, About, Contact, Privacy, and Terms pages are all editable here.',
                        icon: '📝',
                    },
                ].map(item => (
                    <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/[0.06] hover:border-gold/20 transition-colors">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-white text-[12px] font-bold">{item.title}</p>
                                <code className="text-[10px] text-white/30 font-mono">{item.path}</code>
                            </div>
                            <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'users',
        icon: Users,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/20',
        title: 'Customer Accounts & Admin Roles',
        subtitle: 'Managing users and access',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    <code className="bg-white/10 px-1 rounded text-[11px]">/admin/users</code> shows all registered customers with their email, order count, and account status.
                </p>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <p className="text-white text-[12px] font-bold mb-2">Granting admin access to another person</p>
                        <ol className="space-y-2 text-white/60 text-[12px]">
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">1.</span> The person must first create an account on the store (sign up with email).</li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">2.</span> Go to Admin → Users, find their email account.</li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">3.</span> Click "Make Admin" or alternatively run in Supabase SQL Editor: <code className="bg-white/10 px-1 rounded text-[11px]">UPDATE profiles SET role = 'admin' WHERE email = 'their@email.com';</code></li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">4.</span> They can now access <code className="bg-white/10 px-1 rounded text-[11px]">/admin</code> immediately.</li>
                        </ol>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/60 text-[12px]">
                            Only grant admin access to people you fully trust. Admin users have full control over the store, products, orders, and settings.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'social',
        icon: Share2,
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10 border-sky-500/20',
        title: 'Social Media Links',
        subtitle: 'Update your storefront social icons',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Social icons appear in the footer of every page. Update them from <code className="bg-white/10 px-1 rounded text-[11px]">Settings → Social & Navigation</code>.
                </p>
                <div className="space-y-3">
                    {[
                        { platform: 'Instagram', hint: 'https://www.instagram.com/dinacosmetic' },
                        { platform: 'TikTok', hint: 'https://www.tiktok.com/@dinacosmetic' },
                        { platform: 'YouTube', hint: 'https://www.youtube.com/@dinacosmetic' },
                        { platform: 'Pinterest', hint: 'https://www.pinterest.com/dinacosmetic' },
                        { platform: 'Facebook', hint: 'https://www.facebook.com/dinacosmetic' },
                    ].map(item => (
                        <div key={item.platform} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/[0.06]">
                            <p className="text-white text-[12px] font-bold w-24 flex-shrink-0">{item.platform}</p>
                            <p className="text-white/30 text-[11px] font-mono">{item.hint}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white/60 text-[12px]">
                        Always paste the full URL including <code className="bg-white/10 px-1 rounded text-[11px]">https://</code>. Leave a field blank to hide that platform's icon from the footer.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'announcement',
        icon: Megaphone,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20',
        title: 'Announcement Bar',
        subtitle: 'Control the banner that runs across every page',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    The announcement bar is the scrolling banner at the very top of every page on the storefront. Go to <code className="bg-white/10 px-1 rounded text-[11px]">Settings → Announcement Bar</code>.
                </p>
                {[
                    { icon: '✏️', title: 'Adding messages', desc: 'Type each message on a new line in the text area. All messages rotate automatically in a loop. Example: "Free shipping on orders over $100", "New collection dropping May 1st".' },
                    { icon: '⚡', title: 'Instant update', desc: 'Click "Save Announcement Messages" and the bar updates on the live site within seconds — no redeploy needed.' },
                    { icon: '🔇', title: 'Hiding the bar', desc: 'To temporarily hide the announcement bar, clear all messages and save. The bar disappears from the storefront.' },
                ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-white text-[12px] font-bold">{item.title}</p>
                        <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'troubleshooting',
        icon: RefreshCw,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20',
        title: 'Troubleshooting',
        subtitle: 'Fix common issues quickly',
        content: (
            <div className="space-y-4">
                {[
                    {
                        problem: 'Changes in admin aren\'t showing on the store',
                        solution: 'Hard refresh the browser (Ctrl+Shift+R / Cmd+Shift+R). If still not showing, wait 30 seconds and try again. All pages use force-dynamic rendering — changes should appear within 1 minute maximum.',
                    },
                    {
                        problem: 'An order is stuck on "Pending" after payment',
                        solution: 'Go to Stripe Dashboard → Developers → Webhooks → your endpoint → find the failed checkout.session.completed event → click Resend. The order will update automatically within 10 seconds.',
                    },
                    {
                        problem: 'Customer didn\'t receive order confirmation email',
                        solution: 'Check Vercel → Functions tab for errors. Check Resend dashboard → Emails to see if it was sent and bounced. Ask the customer to check their spam folder. Resend from Resend dashboard manually if needed.',
                    },
                    {
                        problem: 'Video is stuck on "Processing"',
                        solution: 'Wait at least 5 minutes. If still processing, go to Mux Dashboard → Assets and check the status there. If it shows an error, delete the video record from admin and re-upload.',
                    },
                    {
                        problem: 'Shipping label generation fails',
                        solution: 'Check that the product weight is set (not 0). Check that your SHIPPO_API_KEY is set in Vercel env vars. Check that the WAREHOUSE_* address variables are correctly set (full address, 2-letter state code).',
                    },
                    {
                        problem: 'Stock shows wrong number',
                        solution: 'Go to Products, find the product, and manually set the correct stock using the +/- buttons or the stock input field. The system deducts stock atomically on order but can drift if orders were cancelled manually.',
                    },
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-white text-[12px] font-bold">{item.problem}</p>
                        </div>
                        <div className="flex items-start gap-2 ml-6">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-white/60 text-[12px] leading-relaxed">{item.solution}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
]

export default function AdminGuidePage() {
    const [openSection, setOpenSection] = useState<string | null>('daily')

    return (
        <div className="space-y-8 animate-luxury-fade pb-24 max-w-3xl">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6 text-gold" />
                    <h1 className="text-4xl font-serif text-white tracking-luxury uppercase">How to Use</h1>
                </div>
                <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">
                    Operations Manual · A to Z · For Store Owners
                </p>
                <p className="text-white/40 text-sm mt-3 leading-relaxed">
                    Complete guide to running your store. Every admin section covered — no technical knowledge required.
                    Click any section to expand it.
                </p>
            </div>

            {/* Quick nav */}
            <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setOpenSection(s.id === openSection ? null : s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            openSection === s.id
                                ? 'bg-gold text-black border-gold'
                                : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                    >
                        <s.icon className="w-3 h-3" />
                        {s.title.split(' ').slice(0, 2).join(' ')}
                    </button>
                ))}
            </div>

            {/* Accordion sections */}
            <div className="space-y-3">
                {sections.map(section => {
                    const isOpen = openSection === section.id
                    return (
                        <div
                            key={section.id}
                            className={`border rounded-2xl overflow-hidden transition-all ${
                                isOpen ? 'border-gold/20' : 'border-white/[0.06]'
                            }`}
                        >
                            {/* Section header */}
                            <button
                                onClick={() => setOpenSection(isOpen ? null : section.id)}
                                className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${
                                    isOpen ? 'bg-gold/5' : 'bg-white/[0.02] hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.bgColor} flex-shrink-0`}>
                                        <section.icon className={`w-4 h-4 ${section.color}`} />
                                    </div>
                                    <div>
                                        <p className={`text-[13px] font-bold ${isOpen ? 'text-white' : 'text-white/80'}`}>
                                            {section.title}
                                        </p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                                            {section.subtitle}
                                        </p>
                                    </div>
                                </div>
                                {isOpen
                                    ? <ChevronUp className="w-4 h-4 text-gold flex-shrink-0" />
                                    : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                                }
                            </button>

                            {/* Section content */}
                            {isOpen && (
                                <div className="px-6 py-6 bg-[#0B0B0D] border-t border-white/[0.04]">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer help note */}
            <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-6 flex gap-4">
                <HelpCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-white text-[13px] font-bold mb-1">Need help with something not covered here?</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        Check the Vercel deployment logs for server errors, the Supabase dashboard for database issues,
                        and the Stripe Dashboard for payment problems. The developer can reference
                        <code className="bg-white/10 px-1 rounded mx-1 text-[11px]">README.md</code>
                        and the
                        <code className="bg-white/10 px-1 rounded mx-1 text-[11px]">supabase/migrations/</code>
                        folder for technical documentation.
                    </p>
                </div>
            </div>
        </div>
    )
}
