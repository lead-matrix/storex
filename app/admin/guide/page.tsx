/**
 * /admin/guide — Static "How to Use" operations manual for the store owner.
 * No database queries required. Pure static content.
 */

'use client'

import { useState } from 'react'
import {
    ClipboardList, ShoppingCart, Package, Truck, Mail,
    Settings, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
    BookOpen, Zap, Scale, HelpCircle
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
                            description: 'For each paid + unfulfilled order: click the order row → click "View Details" → click "Generate Shipping Label". This opens the Fulfillment panel where you select the shipping rate and purchase the label through Shippo.',
                            color: 'border-emerald-500/30 bg-emerald-500/5',
                            labelColor: 'text-emerald-400',
                        },
                        {
                            step: '3',
                            title: 'Print and ship',
                            description: 'After the label is generated, click "Download Label" to open the PDF. Print it, stick it on the package, and hand it to your carrier (USPS drop-off or pickup). The order will show a tracking number automatically.',
                            color: 'border-purple-500/30 bg-purple-500/5',
                            labelColor: 'text-purple-400',
                        },
                        {
                            step: '4',
                            title: 'Watch for stale pending orders',
                            description: 'Check for any orders with status "Pending" that are more than 24 hours old — these may indicate a payment that failed silently. You can check Stripe Dashboard to confirm. Cancel stale pending orders to keep your dashboard clean.',
                            color: 'border-red-500/30 bg-red-500/5',
                            labelColor: 'text-red-400',
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
        subtitle: 'From cart to doorstep',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Here is the complete lifecycle of an order, from the moment a customer clicks "Buy" to delivery.
                </p>
                <div className="relative pl-6 space-y-0">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
                    {[
                        { label: 'Status: Pending', title: 'Customer starts checkout', desc: 'When a customer clicks checkout, an order is created in your database with status "Pending". Stripe opens the payment page.', color: 'bg-amber-500' },
                        { label: 'Status: Paid', title: 'Payment succeeds', desc: `Stripe processes the card. A webhook fires to your store, which marks the order "Paid" and records the customer's address, phone, and line items automatically. The customer receives an order confirmation email.`, color: 'bg-emerald-500' },
                        { label: 'Action Required', title: 'You generate a shipping label', desc: 'From the Admin → Orders page, open the order and click "Generate Shipping Label". Your store contacts Shippo, calculates the weight-based rate, and purchases a USPS/UPS/DHL label. The tracking number is saved to the order.', color: 'bg-gold' },
                        { label: 'Email Sent', title: 'Customer gets shipping notification', desc: 'The moment a label is generated, a shipping notification email with the tracking number is sent to the customer automatically via Resend.', color: 'bg-purple-500' },
                        { label: 'Done', title: 'Order fulfilled', desc: `Once all items in the order have labels, the order's fulfillment status changes to "Fulfilled". No further action required.`, color: 'bg-blue-500' },
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
                        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">Important</p>
                        <p className="text-white/60 text-[12px] mt-1 leading-relaxed">
                            If a Stripe webhook fails (e.g. server timeout), the order may stay as "Pending" even after payment. You can manually check your Stripe Dashboard → Events to see if the webhook fired. If not, you can resend it from there.
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
        title: 'How to Add a Product',
        subtitle: 'Getting products live in the store',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Follow these steps to add a new product to the store. All products start as inactive so you can set everything up before customers see it.
                </p>
                <div className="space-y-3">
                    {[
                        {
                            num: '01',
                            title: 'Go to Products → Add New Product',
                            desc: 'Click the gold "Add New Product" button in the top right of the Products page.',
                        },
                        {
                            num: '02',
                            title: 'Fill in the basics',
                            desc: 'Title (required), Description, Base Price (required), and SKU. The slug is auto-generated from the title.',
                        },
                        {
                            num: '03',
                            title: 'Set the weight — this is critical',
                            desc: 'Enter the product weight in ounces (oz). This is used to calculate shipping rates at checkout. If you leave it blank, the system defaults to 2oz, which may make shipping prices wrong. Weigh the packaged product with its packaging.',
                        },
                        {
                            num: '04',
                            title: 'Upload product images',
                            desc: 'Upload at least one image. The first image is used as the main product photo. You can drag to reorder. Images are stored in Supabase Storage and served via CDN.',
                        },
                        {
                            num: '05',
                            title: 'Set stock quantity',
                            desc: 'Enter how many units you have. Stock is automatically decremented when orders are placed. You can adjust stock later from the Products page using the +/- buttons.',
                        },
                        {
                            num: '06',
                            title: 'Add variants (optional)',
                            desc: 'If the product comes in different options (e.g. Shade 01, Shade 02), click "Add Variant". Each variant can have its own price override (if different from the base price) and its own stock level.',
                        },
                        {
                            num: '07',
                            title: 'Set to Active and Save',
                            desc: 'Toggle the status to "Active" when you\'re ready for customers to see it. Click Save. The product appears on the store immediately.',
                        },
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
            </div>
        )
    },
    {
        id: 'shipping',
        icon: Scale,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/20',
        title: 'How Shipping Rates Work',
        subtitle: 'Weight-based, admin-configurable',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Shipping rates are calculated automatically at checkout based on the total weight of the cart. You control all the rate brackets from Settings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        {
                            icon: '⚖️',
                            title: 'Weight determines the rate',
                            desc: 'The system adds up the weight of every item in the cart (in oz) and looks up which weight bracket that falls into. Each bracket has a price you set in admin.',
                        },
                        {
                            icon: '🚚',
                            title: 'Four rate types',
                            desc: 'Standard Domestic, Express Domestic, Standard International, Express International. Each has its own weight brackets and pricing. Customers choose at checkout.',
                        },
                        {
                            icon: '🎁',
                            title: 'Free shipping threshold',
                            desc: 'Set a free shipping minimum (e.g. "Free shipping on orders over $100") in Settings → Shipping. When the cart subtotal hits the threshold, standard shipping is shown as $0.',
                        },
                        {
                            icon: '⚠️',
                            title: 'Always set product weights',
                            desc: 'If a product has no weight set, it defaults to 2oz. This makes shipping look cheaper than it is and causes you to lose money on larger shipments. Set weights on every product.',
                        },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <p className="text-white text-[12px] font-bold">{item.title}</p>
                            <p className="text-white/50 text-[12px] mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4">
                    <p className="text-gold text-[11px] font-bold uppercase tracking-wider mb-2">To configure shipping rates:</p>
                    <p className="text-white/60 text-[12px] leading-relaxed">
                        Go to <span className="text-white font-medium">Settings → Shipping Rates</span>. You'll see four sections (Standard, Express, International Standard, International Express). Each has an editable table of weight brackets and prices. Changes take effect immediately — no redeploy needed.
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
        title: 'How Email Notifications Work',
        subtitle: 'Automatic transactional emails via Resend',
        content: (
            <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed">
                    Two emails are sent automatically — you don't need to do anything for them to send. You can customize their appearance from the Email Settings page.
                </p>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <p className="text-white text-[12px] font-bold">Order Confirmation Email</p>
                        </div>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                            Sent automatically when Stripe confirms payment. Contains the order ID, items purchased, and total. Triggers as part of the Stripe webhook processing.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-purple-400" />
                            <p className="text-white text-[12px] font-bold">Shipping Notification Email</p>
                        </div>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                            Sent automatically when you generate a shipping label. Contains the tracking number. The customer can use it to track their package directly.
                        </p>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">If emails aren't sending:</p>
                    <ol className="space-y-1.5 text-white/60 text-[12px]">
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">1.</span> Check that <code className="bg-white/10 px-1 rounded text-[11px]">RESEND_API_KEY</code> is set in your Vercel environment variables.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">2.</span> Check Vercel function logs (Vercel Dashboard → Functions tab) for any error messages starting with <code className="bg-white/10 px-1 rounded text-[11px]">[Stripe Webhook] Order confirmation email failed</code>.</li>
                        <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">3.</span> In your Resend dashboard, check that the sending domain is verified and that the "from" address matches your verified domain.</li>
                    </ol>
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
        subtitle: 'What each settings section controls',
        content: (
            <div className="space-y-3">
                {[
                    {
                        title: 'General Settings',
                        path: '/admin/settings',
                        desc: 'Store name, contact email, and site URL. The site URL is used to build links in emails — make sure it\'s set to your production domain (https://dinacosmetic.store).',
                        icon: '🏪',
                    },
                    {
                        title: 'Shipping Settings',
                        path: '/admin/settings/shipping',
                        desc: 'All weight brackets and prices for Standard, Express, International Standard, and International Express shipping. Also the free shipping threshold and the warehouse sender address used on Shippo labels.',
                        icon: '📦',
                    },
                    {
                        title: 'Email Settings',
                        path: '/admin/email',
                        desc: 'Customize the subject lines, body text, and accent colors for order confirmation and shipping notification emails. Changes are applied to all future emails immediately.',
                        icon: '✉️',
                    },
                    {
                        title: 'CMS Pages',
                        path: '/admin/cms',
                        desc: 'Edit the content of static pages like the About page and Terms & Conditions. Uses a block-based editor — no code required.',
                        icon: '📝',
                    },
                    {
                        title: 'Marketing',
                        path: '/admin/marketing',
                        desc: 'Manage discount codes and promotional banners. Create percentage or flat-amount coupon codes, set expiry dates, and restrict to specific products or minimums.',
                        icon: '🎫',
                    },
                    {
                        title: 'Media Library',
                        path: '/admin/media',
                        desc: 'Upload and manage all images used across the store. You can upload here and then reference them from product forms or CMS pages.',
                        icon: '🖼️',
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
                    Operations Manual · For Store Owners
                </p>
                <p className="text-white/40 text-sm mt-3 leading-relaxed">
                    This guide covers everything you need to run the store day-to-day. No technical knowledge required.
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
                        {s.title.split(' ').slice(0, 3).join(' ')}
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
                        and the Stripe Dashboard for payment-related problems. The developer can also check
                        <code className="bg-white/10 px-1 rounded mx-1 text-[11px]">ADMIN_SOVEREIGN_GUIDE.md</code>
                        in the repository for technical documentation.
                    </p>
                </div>
            </div>
        </div>
    )
}
