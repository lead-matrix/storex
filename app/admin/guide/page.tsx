/**
 * /admin/guide — Complete A-to-Z operations manual for the store owner.
 * Fully audited and verified against the actual codebase.
 * No database queries. Pure static content.
 */

'use client'

import { useState } from 'react'
import {
    ClipboardList, ShoppingCart, Package, Truck, Mail,
    Settings, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
    BookOpen, HelpCircle, BarChart2, Users, Video,
    Image as ImageIcon, Tag, Megaphone, Share2,
    AlertTriangle, FileText, RefreshCw, Globe, Zap, Eye
} from 'lucide-react'

const sections = [
    // ─────────────────────────────────────────────────────────────────────
    // 1. DAILY OPERATIONS
    // ─────────────────────────────────────────────────────────────────────
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
                            title: 'Check the Dashboard',
                            description: 'Go to Admin → Dashboard. You\'ll see Gross Revenue, Active Orders, Product Vault count, and Low Inventory alerts. Any product variant with stock under 10 units shows as a low-inventory alert — restock before it hits zero.',
                            color: 'border-gold/30 bg-gold/5',
                            labelColor: 'text-gold',
                        },
                        {
                            step: '2',
                            title: 'Check for new paid orders',
                            description: 'Go to Admin → Orders. Use the "Paid" filter tab. Any order showing "Paid" + fulfillment "Unfulfilled" needs a shipping label. Do this first — customers expect fast dispatch.',
                            color: 'border-emerald-500/30 bg-emerald-500/5',
                            labelColor: 'text-emerald-400',
                        },
                        {
                            step: '3',
                            title: 'Generate shipping labels',
                            description: 'Click an order row to expand it → click "Generate Label". The system contacts Shippo, calculates weight-based rates, and purchases the label. The PDF downloads automatically. The tracking number is saved and emailed to the customer automatically.',
                            color: 'border-purple-500/30 bg-purple-500/5',
                            labelColor: 'text-purple-400',
                        },
                        {
                            step: '4',
                            title: 'Print, pack, and ship',
                            description: 'Print the label PDF. Attach it to the package. Drop it at USPS or your carrier. No further action needed — the customer already has their tracking number.',
                            color: 'border-blue-500/30 bg-blue-500/5',
                            labelColor: 'text-blue-400',
                        },
                        {
                            step: '5',
                            title: 'Check abandoned carts',
                            description: 'Go to Marketing → Abandoned Carts. Any cart with a customer email that hasn\'t checked out is a recovery opportunity. Click "Send Recovery Email" on each one. This is one of the highest-ROI daily actions.',
                            color: 'border-lime-500/30 bg-lime-500/5',
                            labelColor: 'text-lime-400',
                        },
                        {
                            step: '6',
                            title: 'Check Live Web Analytics',
                            description: 'Go to Analytics → Live Web Analytics tab. See who is on the site right now, which countries visitors are coming from, and which pages are getting traffic. Refreshes automatically every 30 seconds.',
                            color: 'border-indigo-500/30 bg-indigo-500/5',
                            labelColor: 'text-indigo-400',
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

    // ─────────────────────────────────────────────────────────────────────
    // 2. HOW ORDERS WORK
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'orders',
        icon: ShoppingCart,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        title: 'How Orders Work',
        subtitle: 'From cart to doorstep — complete lifecycle',
        content: (
            <div className="space-y-5">
                <p className="text-white/60 text-sm leading-relaxed">
                    Every order goes through a defined lifecycle. Here is exactly what happens at each stage — and what you need to do.
                </p>

                {/* Order lifecycle */}
                <div className="relative pl-6 space-y-0">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
                    {[
                        { label: 'Status: Pending', title: 'Customer starts checkout', desc: 'An order is created in the database with status "Pending". Stripe opens the secure payment page. At this point no money has moved.', color: 'bg-amber-500' },
                        { label: 'Status: Paid', title: 'Payment succeeds', desc: 'Stripe charges the card. A webhook fires to the store, which automatically marks the order "Paid", saves the customer\'s address, phone, and line items. The customer receives an order confirmation email via Resend.', color: 'bg-emerald-500' },
                        { label: 'Action Required', title: 'You generate a shipping label', desc: 'Open the order → click "Generate Label". Shippo calculates the rate based on product weight and destination, purchases the label, and saves the tracking number to the order record.', color: 'bg-gold' },
                        { label: 'Email Sent', title: 'Customer gets shipping notification', desc: 'The moment a label is generated, a shipping confirmation email with the tracking number goes out automatically via Resend. No manual action needed.', color: 'bg-purple-500' },
                        { label: 'Done', title: 'Order complete', desc: 'Once the label is generated, fulfillment status updates to "Fulfilled". No further admin action required.', color: 'bg-blue-500' },
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

                {/* Order statuses explained */}
                <div>
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider mb-3">Order status reference</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { status: 'Pending', color: 'text-amber-400', desc: 'Customer at checkout, payment not yet confirmed.' },
                            { status: 'Paid', color: 'text-emerald-400', desc: 'Payment confirmed. Needs a shipping label.' },
                            { status: 'Shipped', color: 'text-blue-400', desc: 'Label generated, package dispatched.' },
                            { status: 'Cancelled', color: 'text-red-400', desc: 'Order cancelled. No fulfillment action.' },
                            { status: 'Refunded', color: 'text-purple-400', desc: 'Refund issued via Stripe. Closed.' },
                        ].map(s => (
                            <div key={s.status} className="flex gap-3 p-3 bg-white/5 border border-white/[0.06] rounded-xl">
                                <span className={`text-[11px] font-black w-20 flex-shrink-0 ${s.color}`}>{s.status}</span>
                                <span className="text-white/50 text-[11px]">{s.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reprint label */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-[12px] font-bold mb-1">📋 Reprinting a label</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        If you need to reprint a label, open the order → click "Reprint Label". The system fetches the already-purchased label from Shippo and downloads the PDF again. No new label is purchased.
                    </p>
                </div>

                {/* Export orders */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-[12px] font-bold mb-1">📥 Exporting orders to CSV</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        On the Orders page, click the "Export CSV" button in the top right. This downloads all order data (ID, customer, items, amounts, status, tracking) as a spreadsheet.
                    </p>
                </div>

                {/* Webhook warning */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">If an order stays Pending after payment</p>
                        <p className="text-white/60 text-[12px] mt-1 leading-relaxed">
                            The Stripe webhook may have failed. Go to Stripe Dashboard → Developers → Webhooks → your endpoint → find the failed <code className="bg-white/10 px-1 rounded text-[10px]">checkout.session.completed</code> event → click "Resend". The order will update automatically within 10 seconds.
                        </p>
                    </div>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 3. MANAGING PRODUCTS
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'products',
        icon: Package,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        title: 'Managing Products',
        subtitle: 'Add, edit, variants, stock, and catalog tools',
        content: (
            <div className="space-y-6">
                {/* Adding a product */}
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">How to add a new product</p>
                    {[
                        { num: '01', title: 'Products → Add New Product', desc: 'Click the gold "Add New Product" button in the top right of the Products page.' },
                        { num: '02', title: 'Fill in the basics', desc: 'Title (required), Description, Base Price in dollars (required), SKU. The URL slug is auto-generated from the title — you can override it.' },
                        { num: '03', title: 'Set weight — critical for shipping', desc: 'Enter product weight in ounces (oz) including packaging. This is used to calculate the exact shipping charge at checkout. If left blank it defaults to 2oz which will undercharge shipping on heavier items.' },
                        { num: '04', title: 'Upload product images', desc: 'Upload at least one image. The first image is the main product photo shown in the store. Images are CDN-served automatically.' },
                        { num: '05', title: 'Set stock quantity', desc: 'Enter how many units you have. Stock decrements automatically when an order is placed. Low stock (under 10 units per variant) triggers a dashboard alert.' },
                        { num: '06', title: 'Add variants (optional)', desc: 'If the product comes in options (e.g. Shade 01, Shade 02), click "Add Variant". Each variant has its own name, price override, and independent stock level.' },
                        { num: '07', title: 'Assign a category', desc: 'Select the product\'s category. This determines which collection page it appears on.' },
                        { num: '08', title: 'Set Active and Save', desc: 'Toggle status to "Active" and click Save. The product appears on the storefront immediately — no redeploy needed.' },
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

                {/* Catalog spreadsheet */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-2">📊 Catalog Spreadsheet View</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to Products → Catalog View for a spreadsheet-style editor. You can bulk-edit prices, stock, and status for multiple products at once — much faster than editing one by one. Click any cell to edit inline. Changes save automatically.
                    </p>
                </div>

                {/* Bulk import */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-[12px] font-bold mb-1">📥 Bulk CSV Import</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        On the Products page, click "Import CSV" to upload a spreadsheet of products. The CSV must include: title, price, stock, weight_oz, sku, status. Download the template from the import dialog to ensure correct column headers.
                    </p>
                </div>

                {/* Bestsellers */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-[12px] font-bold mb-1">⭐ Bestsellers Page</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        The storefront has a dedicated /bestsellers page. To feature a product there, mark it as a "bestseller" in the product edit form using the Bestseller toggle. Products marked as bestsellers also appear in the Bestsellers slider on the homepage.
                    </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">Always set product weight</p>
                        <p className="text-white/60 text-[12px] mt-1">If weight is 0 or blank, shipping will be calculated at 2oz regardless of actual weight. This means you may lose money on heavy orders. Weigh each product in its packaging before adding it.</p>
                    </div>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 4. CATEGORIES
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'categories',
        icon: Tag,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10 border-pink-500/20',
        title: 'Categories',
        subtitle: 'Organize your product catalog',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Categories live at <code className="bg-white/10 px-1 rounded text-[11px]">/admin/categories</code>. Every product must belong to a category. Categories become collection pages on the storefront at <code className="bg-white/10 px-1 rounded text-[11px]">/collections/[slug]</code>.
                </p>
                {[
                    { icon: '➕', title: 'Creating a category', desc: 'Click "New Category". Enter a name (e.g. "Lip Color"), a slug (auto-generated, e.g. "lip-color"), and optionally a cover image URL from your Media Library. The slug becomes the URL — do not change it after products are live.' },
                    { icon: '🖼️', title: 'Category cover image', desc: 'The cover image is shown on the Shop page and the Collections page as a card. Recommended size: 1200×1500px (4:5 portrait). Upload to Media Library first, copy the URL, paste here.' },
                    { icon: '✏️', title: 'Editing a category', desc: 'Click the edit icon on any category card. Update name or image. The slug should not be changed once the category is live — it will break existing product URLs.' },
                    { icon: '⚡', title: 'Instant updates', desc: 'Category changes go live immediately on the storefront — no redeploy needed.' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 5. CMS PAGES
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'builder',
        icon: Globe,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/20',
        title: 'Page Builder — 13 Blocks',
        subtitle: 'Build any campaign page in under 5 minutes',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    The Page Builder lets you create fully custom landing pages, sale pages, campaign pages, and more — without writing a single line of code. Pages are saved to the database and published instantly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { step: '1', title: 'Go to Admin → Page Builder', description: 'Click "Page Builder" in the left sidebar or navigate to /admin/builder.' },
                        { step: '2', title: 'Create a New Page', description: 'Click "New Page". Give it a title and a URL slug (e.g. "summer-sale" becomes /pages/summer-sale).' },
                        { step: '3', title: 'Drag blocks onto the canvas', description: 'Click any block from the left panel to add it. Drag the ⠿ handle to reorder. Click a block to open its props editor.' },
                        { step: '4', title: 'Edit block properties', description: 'Click "Props" tab to edit text, images, CTAs. Upload images directly by clicking the ⬆ button on any image field.' },
                        { step: '5', title: 'Publish', description: 'Click "Publish" in the top bar. The page goes live at /pages/[slug] instantly.' },
                    ].map(item => (
                        <div key={item.step} className="flex gap-3 p-3 rounded bg-purple-950/20 border border-purple-500/10">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{item.step}</div>
                            <div>
                                <p className="text-white text-xs font-semibold mb-1">{item.title}</p>
                                <p className="text-white/50 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-4 rounded bg-zinc-900 border border-white/10">
                    <p className="text-[9px] uppercase tracking-widest text-purple-400 font-bold mb-2">Available Blocks (13 total)</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {['🖼️ Full Hero', '🎬 Video Hero', '📄 Text Block', '🌄 Image Banner',
                          '🛍️ Product Shelf', '⬛⬜ Two Column', '↔️ Before / After',
                          '⏱️ Countdown Timer', '✦ Icon Grid', '✉️ Newsletter',
                          '💬 Testimonial', '❓ FAQ Accordion', '➖ Divider'
                        ].map(b => (
                            <span key={b} className="text-[10px] text-white/60 flex items-center gap-1.5">{b}</span>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 'cms',
        icon: FileText,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/20',
        title: 'CMS Pages (Experiences)',
        subtitle: 'Build and edit storefront pages without code',
        content: (
            <div className="space-y-6">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → CMS Pages. This lets you edit any storefront page — Home, About, Contact, Privacy, Terms, Sale — using drag-and-drop content blocks. Changes go live immediately.
                </p>
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">How to edit a page</p>
                    {[
                        { num: '01', title: 'Go to Admin → CMS Pages', desc: 'You\'ll see a list of all live pages. Click the pencil icon next to any page to open the block editor.' },
                        { num: '02', title: 'Add or reorder blocks', desc: 'Click "Add Block" and choose a block type. Drag the handle icon to reorder blocks vertically. Each block is a self-contained section of the page.' },
                        { num: '03', title: 'Edit block content', desc: 'Click any block to select it. The right panel shows all editable fields for that block — text, images, links, colors. Changes show a live preview.' },
                        { num: '04', title: 'Save and publish', desc: 'Click "Save & Publish". The page updates on the live storefront immediately.' },
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
                            { name: 'Hero Banner', desc: 'Full-width hero with heading, subtext, background image, and CTA button.' },
                            { name: 'Image Banner', desc: 'Single large image with optional overlay text and a CTA link.' },
                            { name: 'Philosophy Grid', desc: 'Icon + title + description grid. Use for brand values or feature lists.' },
                            { name: 'Product Grid', desc: 'Live grid of featured products pulled from the database.' },
                            { name: 'Video Block', desc: 'Full-width Mux video player — autoplay, muted, looping.' },
                            { name: 'Rich Text', desc: 'Paragraphs, headings, bullet points. Pure editorial content.' },
                            { name: 'Contact Form', desc: 'Pre-built contact form with email submission built in.' },
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
                            { label: 'Hero / Video Background', size: '1920 × 1080 px', ratio: '16:9 landscape' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 6. MEDIA LIBRARY
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'media',
        icon: ImageIcon,
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/10 border-teal-500/20',
        title: 'Media Library',
        subtitle: 'Central vault for all store images',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Media. This is where every image used on the store lives. Always upload here first, then copy the URL into products, CMS blocks, or categories.
                </p>
                {[
                    { icon: '⬆️', title: 'Uploading images', desc: 'Click "Upload Images" or drag and drop files into the upload zone. Multiple files at once are supported. Accepted formats: JPG, PNG, WEBP. Max 10MB per file. Images are automatically compressed.' },
                    { icon: '🔗', title: 'Getting the image URL', desc: 'Click any image to select it. Click "Copy URL". The CDN-backed URL is now in your clipboard — paste it anywhere (product image field, CMS block, category cover).' },
                    { icon: '🗑️', title: 'Deleting images', desc: 'Select an image and click the trash icon. Warning: if the image is already used in a product or CMS page, it will show as broken. Always check references before deleting.' },
                    { icon: '🔲', title: 'Grid vs List view', desc: 'Toggle between grid view (visual thumbnails) and list view (filenames + upload dates) using the view toggle buttons in the top right.' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 7. VIDEO LIBRARY
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'videos',
        icon: Video,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/20',
        title: 'Video Library (Mux)',
        subtitle: 'Upload and manage storefront video content',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Video Manager. Videos use Mux for professional HLS streaming — they play instantly on any device. Upload once, use in any CMS Video Block.
                </p>
                {[
                    { icon: '🎬', title: 'Upload a video', desc: 'Click "Upload Video", give it a title, and select your MP4 or MOV file. Max 500MB. After upload, Mux starts transcoding — this takes 1–3 minutes. Status shows "Processing" during this time.' },
                    { icon: '✅', title: 'Video becomes "Ready" automatically', desc: 'Once Mux finishes processing, the status changes to "Ready" automatically via a Mux webhook. You do not need to refresh the page — the UI updates itself.' },
                    { icon: '📺', title: 'Using the video in CMS', desc: 'In the CMS block editor, add a "Video Block". Select the video from your uploaded Mux library. On the storefront, it plays auto-muted and loops for a cinematic effect.' },
                    { icon: '⚠️', title: 'If a video stays "Processing" over 10 minutes', desc: 'Check the Mux Dashboard → Assets for errors. If Mux shows an error, delete the video record from admin and re-upload the file. Make sure the source file is not corrupted before re-uploading.' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 8. ANALYTICS
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'analytics',
        icon: BarChart2,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10 border-indigo-500/20',
        title: 'Analytics & Live Web Tracking',
        subtitle: 'Revenue intelligence + real-time visitor globe',
        content: (
            <div className="space-y-5">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Analytics. The page has two tabs — "Revenue Intelligence" for sales data and "Live Web Analytics" for real-time visitor tracking.
                </p>

                {/* Tab 1 */}
                <div>
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider mb-3">Tab 1 — Revenue Intelligence</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { icon: '💰', title: 'Gross Revenue', desc: 'Total revenue from all paid orders. Shown as a running total.' },
                            { icon: '🚚', title: 'Shipping Revenue', desc: 'Shipping fees collected from customers across all paid orders.' },
                            { icon: '🛒', title: 'Avg. Order Value', desc: 'Gross revenue divided by total order count.' },
                            { icon: '👥', title: 'Total Customers', desc: 'Total registered customer profiles in the database.' },
                            { icon: '📈', title: '7-Day Sales Chart', desc: 'Daily revenue for the past 7 days as a line chart.' },
                            { icon: '📊', title: '30-Day Trend', desc: 'Revenue curve for the past 30 days.' },
                            { icon: '🏆', title: 'Top Selling Products', desc: 'Products ranked by units sold. Shows share % of total volume.' },
                        ].map(item => (
                            <div key={item.title} className="p-3 rounded-xl bg-white/5 border border-white/[0.06]">
                                <div className="text-xl mb-1">{item.icon}</div>
                                <p className="text-white text-[12px] font-bold">{item.title}</p>
                                <p className="text-white/50 text-[11px] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab 2 */}
                <div>
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider mb-3">Tab 2 — Live Web Analytics</p>
                    <p className="text-white/60 text-[12px] mb-3 leading-relaxed">
                        Tracks every visitor to the storefront in real time. Data is collected via a silent beacon that fires on every page navigation — no cookies, no third-party accounts required.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { icon: '🟢', title: 'Active Right Now', desc: 'Visitors who loaded any page in the last 5 minutes. Updates every 30 seconds with a pulse animation.' },
                            { icon: '📄', title: "Today's Page Views", desc: 'Total page views in the last 24 hours across all storefront pages.' },
                            { icon: '🌍', title: 'Globe Map', desc: 'Interactive SVG world map. Gold dots appear on countries that have sent visitors in the last 30 days. Dot size scales with traffic volume. Hover a dot to see the country name and visitor count.' },
                            { icon: '📄', title: 'Top Pages', desc: 'Which pages get the most views in the last 7 days, shown with progress bars.' },
                            { icon: '📱', title: 'Device Breakdown', desc: 'Desktop vs mobile vs tablet — shown as percentage bars.' },
                            { icon: '🔗', title: 'Traffic Sources', desc: 'Which external sites are sending visitors (referrer domains).' },
                            { icon: '📈', title: '7-Day View Sparkline', desc: 'Page view trend for each of the last 7 days.' },
                        ].map(item => (
                            <div key={item.title} className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                                <div className="text-xl mb-1">{item.icon}</div>
                                <p className="text-white text-[12px] font-bold">{item.title}</p>
                                <p className="text-white/50 text-[11px] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                    <Eye className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        The Live Analytics tab only tracks visitor pages (not admin pages). Admin activity is excluded automatically so your own browsing does not inflate visitor counts.
                    </p>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 9. MARKETING & COUPONS
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'marketing',
        icon: Zap,
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/10 border-lime-500/20',
        title: 'Marketing & Coupons',
        subtitle: 'Discount codes and abandoned cart recovery',
        content: (
            <div className="space-y-6">
                {/* Coupons */}
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Creating a coupon code</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to Admin → Marketing. The coupon form is at the top of the page. Fill in the fields and click "Forge New Coupon":
                    </p>
                    {[
                        { field: 'Coupon Code', desc: 'The code customers type at checkout (e.g. WELCOME20). Auto-uppercased.' },
                        { field: 'Discount Type', desc: '"Percentage" (e.g. 20% off) or "Fixed Amount" (e.g. $10 off).' },
                        { field: 'Discount Value', desc: 'For percentage: enter 20 for 20%. For fixed: enter 10 for $10 off.' },
                        { field: 'Min. Purchase ($)', desc: 'Optional. Customer must spend at least this amount for the code to work.' },
                        { field: 'Max Uses', desc: 'Optional. Code auto-deactivates after this many redemptions. Blank = unlimited.' },
                        { field: 'Expiry Date', desc: 'Optional. Code stops working after midnight on this date.' },
                    ].map(item => (
                        <div key={item.field} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.06]">
                            <p className="text-lime-400 text-[11px] font-bold w-32 flex-shrink-0">{item.field}</p>
                            <p className="text-white/50 text-[12px]">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Coupon management */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-[12px] font-bold mb-2">Managing existing coupons</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        Active coupons are listed below the form. You can toggle a coupon on/off (active/inactive) at any time using the toggle switch. You can also delete a coupon permanently with the trash icon. Deactivating is safer than deleting — the usage history is preserved.
                    </p>
                </div>

                {/* Abandoned carts */}
                <div className="space-y-3">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider">Abandoned Cart Recovery</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to Marketing → Abandoned Carts. This shows all carts that were started but never completed. For each cart with a customer email, click "Send Recovery Email" to send them a personalized email with a one-click recovery link. This is one of the highest-ROI daily actions for any e-commerce store.
                    </p>
                    <div className="bg-lime-500/5 border border-lime-500/20 rounded-xl p-4">
                        <p className="text-lime-400 text-[11px] font-bold uppercase tracking-wider mb-1">What the recovery email contains</p>
                        <p className="text-white/60 text-[12px]">The email shows the customer what they left in their cart, with a direct link to resume checkout. It uses your configured email branding (brand name, accent color, subject line).</p>
                    </div>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 10. EMAIL SETTINGS
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'email',
        icon: Mail,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10 border-pink-500/20',
        title: 'Email Notifications',
        subtitle: 'Customize automated customer emails',
        content: (
            <div className="space-y-5">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Email Settings. Two emails are sent automatically to customers — you can customize both here. Changes apply to all future emails instantly.
                </p>

                {/* Two emails */}
                <div className="space-y-3">
                    {[
                        {
                            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                            title: 'Order Confirmation Email',
                            trigger: 'Triggered automatically when Stripe confirms payment',
                            desc: 'Contains the order ID, items purchased, shipping address, and total amount paid.',
                        },
                        {
                            icon: <Truck className="w-4 h-4 text-purple-400" />,
                            title: 'Shipping Notification Email',
                            trigger: 'Triggered automatically when you generate a shipping label',
                            desc: 'Contains the tracking number so the customer can track their package in real time.',
                        },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">{item.icon}<p className="text-white text-[12px] font-bold">{item.title}</p></div>
                            <p className="text-gold text-[10px] uppercase tracking-wider mb-1">{item.trigger}</p>
                            <p className="text-white/50 text-[12px] leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* What you can customize */}
                <div>
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider mb-3">What you can customize</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { field: 'Brand Name', desc: 'Appears in the email header. Default: DINA COSMETIC.' },
                            { field: 'Brand Tagline', desc: 'Small subtitle under the brand name in the header.' },
                            { field: 'Accent Color', desc: 'The gold/brand color used for borders and headings inside the email. Use the color picker.' },
                            { field: 'Background Color', desc: 'Email background. Keep dark to match the Obsidian Palace brand.' },
                            { field: 'Text Color', desc: 'Main body text color inside the email.' },
                            { field: 'Confirmation Subject', desc: 'Subject line of the order confirmation email.' },
                            { field: 'Shipping Subject', desc: 'Subject line of the shipping notification email.' },
                        ].map(item => (
                            <div key={item.field} className="p-3 bg-white/5 border border-white/[0.06] rounded-xl">
                                <p className="text-pink-400 text-[11px] font-bold">{item.field}</p>
                                <p className="text-white/50 text-[11px] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send test email */}
                <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
                    <p className="text-pink-400 text-[11px] font-bold uppercase tracking-wider mb-1">✉️ Send Test Email</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        After editing settings, click "Send Test Email" to preview exactly what the customer will receive. The test email goes to your admin email address. Always test before going live.
                    </p>
                </div>

                {/* Troubleshoot emails */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">If emails aren't sending:</p>
                    <ol className="space-y-1.5 text-white/60 text-[12px]">
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">1.</span> Check that <code className="bg-white/10 px-1 rounded text-[11px]">RESEND_API_KEY</code> is set in your Vercel environment variables.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">2.</span> Check Vercel → Functions tab for errors containing <code className="bg-white/10 px-1 rounded text-[11px]">[Stripe Webhook] email failed</code>.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">3.</span> In Resend dashboard, verify your sending domain is verified and the "from" address matches your domain.</li>
                    </ol>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 11. SHIPPING RATES
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'shipping',
        icon: Truck,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/20',
        title: 'Shipping Rate Configuration',
        subtitle: 'Weight-based rates, admin-configurable, live at checkout',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Settings → Shipping Rates. All shipping prices are set here. Changes take effect immediately at checkout — no redeploy needed.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: '⚖️', title: 'Weight-based calculation', desc: 'At checkout, the system adds up the weight (oz) of all items in the cart and finds the matching weight bracket you configured. The price for that bracket is charged.' },
                        { icon: '🚚', title: '4 shipping types', desc: 'Standard Domestic, Express Domestic, Standard International, Express International. You configure rates for each. Customers choose at checkout.' },
                        { icon: '🎁', title: 'Free shipping threshold', desc: 'Set a minimum order total for free standard domestic shipping. Example: orders over $75 get free shipping. Leave at $0 to disable. A banner shows this offer on the storefront.' },
                        { icon: '📦', title: 'Weight brackets', desc: 'You define the oz ranges and the price for each range. Example: 0–4oz = $4.99, 5–8oz = $6.99. Create as many brackets as you need for accuracy.' },
                        { icon: '⚠️', title: 'Always set product weights', desc: 'If a product has no weight set, shipping is calculated at 2oz. This undercharges for heavy products. Weigh every product in its packaging before adding it to the store.' },
                        { icon: '🔄', title: 'Recalculate existing rates', desc: 'After changing rates, use the "Recalculate Rates" button to update rate estimates on any pending or unshipped orders.' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 12. SETTINGS REFERENCE
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'settings',
        icon: Settings,
        color: 'text-white/60',
        bgColor: 'bg-white/5 border-white/10',
        title: 'Settings Reference',
        subtitle: 'Every setting explained, with exact paths',
        content: (
            <div className="space-y-3">
                {[
                    {
                        title: 'Brand & General',
                        path: '/admin/settings',
                        desc: 'Store name, tagline, currency, and logo URL. Logo appears in the header and footer. Upload image to Media Library first, then paste the CDN URL here.',
                        icon: '🏪',
                    },
                    {
                        title: 'Store Kill Switch',
                        path: '/admin/settings',
                        desc: 'Toggle "Store Status" to put the storefront in maintenance mode. Customers see a maintenance page. The admin portal continues working normally. Use during large stock updates or design changes.',
                        icon: '🔴',
                    },
                    {
                        title: 'Announcement Bar',
                        path: '/admin/settings → Announcement Bar',
                        desc: 'The scrolling banner at the top of every storefront page. Enter multiple messages (one per line) and they rotate in a loop. Clear all messages to hide the bar. Updates live in seconds.',
                        icon: '📣',
                    },
                    {
                        title: 'Navigation & Social Links',
                        path: '/admin/settings',
                        desc: 'Edit the header navigation links and footer link lists. Also set full URLs for Instagram, TikTok, Facebook, YouTube, Pinterest — these appear as icons in the footer. Leave blank to hide an icon.',
                        icon: '🧭',
                    },
                    {
                        title: 'Shipping Rates',
                        path: '/admin/settings/shipping',
                        desc: 'All weight brackets for Standard, Express, International Standard, and International Express. Also set the free shipping threshold and minimum order amount.',
                        icon: '📦',
                    },
                    {
                        title: 'Email Settings',
                        path: '/admin/email',
                        desc: 'Customize brand name, tagline, accent color, background/text colors, and subject lines for both automated emails. Send a test email to preview before going live.',
                        icon: '✉️',
                    },
                    {
                        title: 'CMS Pages',
                        path: '/admin/cms',
                        desc: 'Edit the content of any storefront page using the block editor. Home, About, Contact, Sale, Privacy, and Terms pages are all managed here.',
                        icon: '📝',
                    },
                ].map(item => (
                    <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/[0.06] hover:border-gold/20 transition-colors">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
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

    // ─────────────────────────────────────────────────────────────────────
    // 13. CUSTOMER ACCOUNTS & USERS
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'users',
        icon: Users,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/20',
        title: 'Customer Accounts & Admin Roles',
        subtitle: 'Managing users and access levels',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Go to Admin → Users (Customers). This lists every registered customer with their email, registration date, and role.
                </p>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <p className="text-white text-[12px] font-bold mb-2">Granting admin access to another person</p>
                        <ol className="space-y-2 text-white/60 text-[12px]">
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">1.</span> The person must first create a customer account on the store (sign up with email).</li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">2.</span> Go to Admin → Users, find their email in the list.</li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">3.</span> Click the role dropdown next to their name and change it from "customer" to "admin".</li>
                            <li className="flex gap-2"><span className="text-orange-400 font-bold">4.</span> They can now access the admin portal at /admin after logging in.</li>
                        </ol>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <p className="text-white text-[12px] font-bold mb-2">Customer account features</p>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                            Registered customers can view their order history at /account. They can see all past orders, their status, and tracking numbers. They cannot access the admin portal unless given admin role.
                        </p>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">Be careful with admin roles</p>
                        <p className="text-white/60 text-[12px] mt-1">Admins can see all orders, all customer data, edit products, and change settings. Only grant admin access to people you fully trust.</p>
                    </div>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 14. SOCIAL MEDIA
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'social',
        icon: Share2,
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10 border-sky-500/20',
        title: 'Social Media Links',
        subtitle: 'Update footer social icons',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Social icons appear in the footer of every storefront page. Update them from Admin → Settings → Navigation & Social Links section.
                </p>
                <div className="space-y-3">
                    {[
                        { platform: 'Instagram', hint: 'https://www.instagram.com/yourhandle' },
                        { platform: 'TikTok', hint: 'https://www.tiktok.com/@yourhandle' },
                        { platform: 'Facebook', hint: 'https://www.facebook.com/yourpage' },
                        { platform: 'YouTube', hint: 'https://www.youtube.com/@yourchannel' },
                        { platform: 'Pinterest', hint: 'https://www.pinterest.com/yourprofile' },
                    ].map(item => (
                        <div key={item.platform} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/[0.06]">
                            <p className="text-white text-[12px] font-bold w-24 flex-shrink-0">{item.platform}</p>
                            <p className="text-white/30 text-[11px] font-mono">{item.hint}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white/60 text-[12px]">
                        Always paste the full URL including <code className="bg-white/10 px-1 rounded text-[11px]">https://</code>. Leave a field blank to hide that platform's icon from the footer. Changes go live immediately after saving.
                    </p>
                </div>
            </div>
        )
    },

    // ─────────────────────────────────────────────────────────────────────
    // 15. ANNOUNCEMENT BAR
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 'announcement',
        icon: Megaphone,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20',
        title: 'Announcement Bar',
        subtitle: 'The rotating banner at the top of every page',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    The announcement bar is the scrolling text banner at the very top of every storefront page. Manage it from Admin → Settings, scroll to the Announcement Bar section.
                </p>
                {[
                    { icon: '✏️', title: 'Adding messages', desc: 'Type each message on a new line in the text area. All messages rotate automatically in a loop. Examples: "Free shipping on orders over $75" · "New collection dropping May 1st" · "Use code WELCOME20 for 20% off your first order".' },
                    { icon: '⚡', title: 'Instant update', desc: 'Click "Save Announcement Messages". The bar on the live site updates within seconds. No redeploy needed.' },
                    { icon: '🔇', title: 'Hiding the bar', desc: 'To temporarily hide the announcement bar, delete all messages and save. The bar disappears from the storefront completely.' },
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

    // ─────────────────────────────────────────────────────────────────────
    // 16. TROUBLESHOOTING
    // ─────────────────────────────────────────────────────────────────────
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
                        problem: 'Changes in admin aren\'t showing on the storefront',
                        solution: 'Hard refresh the browser (Ctrl+Shift+R on Windows / Cmd+Shift+R on Mac). If still not showing, wait 30–60 seconds and try again. All storefront pages use force-dynamic rendering — changes should appear within 1 minute maximum.',
                    },
                    {
                        problem: 'An order is stuck on "Pending" after payment',
                        solution: 'Go to Stripe Dashboard → Developers → Webhooks → your endpoint → find the failed checkout.session.completed event → click "Resend". The order will update to "Paid" automatically within 10 seconds.',
                    },
                    {
                        problem: 'Customer didn\'t receive order confirmation or shipping email',
                        solution: 'Check Vercel → Functions tab for errors. Check Resend dashboard → Emails to see if it was sent and whether it bounced. Ask the customer to check their spam folder. The sending domain must be verified in Resend.',
                    },
                    {
                        problem: 'Video is stuck on "Processing" for more than 10 minutes',
                        solution: 'Check Mux Dashboard → Assets. If Mux shows an error, delete the video record from Admin → Video Manager and re-upload the file. Make sure the source file is not corrupted (try playing it locally first).',
                    },
                    {
                        problem: 'Shipping label generation fails',
                        solution: 'Check that the product has a weight set (not 0oz). Check that SHIPPO_API_KEY is set in Vercel environment variables. Check that the warehouse address env vars (WAREHOUSE_NAME, WAREHOUSE_STREET, WAREHOUSE_CITY, WAREHOUSE_STATE, WAREHOUSE_ZIP, WAREHOUSE_COUNTRY) are all set correctly.',
                    },
                    {
                        problem: 'Stock count shows the wrong number',
                        solution: 'Go to Products, find the product/variant, and manually correct the stock using the +/- buttons or by editing the product. Stock decrements automatically on paid orders but can drift if orders were refunded or cancelled outside the system.',
                    },
                    {
                        problem: 'Live Web Analytics shows no data',
                        solution: 'Make sure you ran the ANALYTICS_MIGRATION.sql in Supabase SQL Editor to create the page_views table. Once created, data populates as soon as visitors load the storefront. Admin page visits are excluded by design.',
                    },
                    {
                        problem: 'Coupon code not working at checkout',
                        solution: 'Check that the coupon is toggled Active in Marketing. Check that it hasn\'t expired or exceeded max uses. Check that the cart total meets the minimum purchase requirement if one is set.',
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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

            {/* Quick nav pill buttons */}
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

                            {isOpen && (
                                <div className="px-6 py-6 bg-[#0B0B0D] border-t border-white/[0.04]">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-6 flex gap-4">
                <HelpCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-white text-[13px] font-bold mb-1">Need help with something not covered here?</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">
                        Check Vercel → Functions tab for server errors. Check Supabase dashboard for database issues.
                        Check Stripe dashboard for payment and webhook issues. Check Resend dashboard for email delivery issues.
                        Check Mux dashboard for video processing issues.
                    </p>
                </div>
            </div>
        </div>
    )
}
