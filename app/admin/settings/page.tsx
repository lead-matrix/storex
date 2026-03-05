import { createClient } from '@/utils/supabase/server'
import { Save, ShieldCheck, Globe, CreditCard, Layout, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { updateStoreSettings, updateHeroContent, updateMenusAndSocials } from '@/lib/actions/admin'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
    const supabase = await createClient()

    const [
        { data: storeInfo },
        { data: storeStatus },
        { data: heroLegacy },
        { data: heroSlides },
        { data: headerNav },
        { data: footerNav },
        { data: socialMedia },
    ] = await Promise.all([
        supabase.from('site_settings').select('*').eq('setting_key', 'store_info').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'store_enabled').maybeSingle(),
        supabase.from('frontend_content').select('*').eq('content_key', 'hero_main').maybeSingle(),
        supabase.from('frontend_content').select('*').eq('content_key', 'hero_slides').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'header_main').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'footer_legal').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'social_media').maybeSingle(),
    ])

    const isEnabled = storeStatus?.setting_value ?? true

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Site Vault & Editor</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Design the Obsidian Experience</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar nav (decorative) */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { label: 'General Info', icon: Globe, active: true },
                        { label: 'Visual Storefront', icon: Layout },
                        { label: 'Security', icon: ShieldCheck },
                        { label: 'Payments', icon: CreditCard },
                    ].map((item) => (
                        <button key={item.label} type="button"
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-md transition-all ${item.active ? 'bg-pearl text-gold shadow-sm' : 'bg-transparent text-textsoft hover:text-charcoal hover:bg-gold/5'}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] uppercase tracking-luxury font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-12">

                    {/* ── Hero Masterpiece ── */}
                    <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
                            <div className="flex items-center gap-4">
                                <ImageIcon className="w-4 h-4 text-gold" />
                                <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Hero Masterpiece Slides</h2>
                            </div>
                            <p className="text-[9px] text-gold uppercase tracking-widest font-bold font-mono animate-pulse">Live Canvas</p>
                        </div>

                        <form action={updateHeroContent} className="space-y-8">
                            <div className="bg-pearl/50 rounded-md p-6 border border-charcoal/5 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Hero Slides Configuration (JSON Array)</label>
                                    <div className="relative">
                                        <textarea
                                            name="hero_slides"
                                            defaultValue={heroSlides?.content_data?.slides ? JSON.stringify(heroSlides.content_data.slides, null, 2) : '[\n  {\n    "id": 1,\n    "image": "",\n    "title": "DINA COSMETIC",\n    "subtitle": "ELEVATE YOUR BEAUTY RITUAL",\n    "buttonText": "SHOP THE LOOK",\n    "link": "/shop"\n  }\n]'}
                                            className="w-full bg-white border border-charcoal/10 rounded-md px-6 py-4 text-xs font-mono text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all h-64 resize-none shadow-inner"
                                        />
                                        <div className="absolute top-4 right-4 bg-pearl text-[8px] px-2 py-1 rounded border border-charcoal/10 uppercase tracking-widest opacity-50 font-bold">JSON Matrix</div>
                                    </div>
                                    <p className="text-[9px] text-textsoft/70 uppercase tracking-luxury leading-relaxed">
                                        Modify the image URLs and text to update the live storefront slides. <br />
                                        <span className="text-gold font-bold">Wait 6s for slide transitions on home page.</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 opacity-40">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium line-through">Legacy Title (Hidden)</label>
                                    <input name="hero_title" defaultValue={heroLegacy?.content_data?.title || ''} className="w-full bg-pearl border border-charcoal/5 rounded px-4 py-2 text-xs" readonly />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium line-through">Legacy Subtitle (Hidden)</label>
                                    <input name="hero_subtitle" defaultValue={heroLegacy?.content_data?.subtitle || ''} className="w-full bg-pearl border border-charcoal/5 rounded px-4 py-2 text-xs" readonly />
                                </div>
                            </div>

                            <button type="submit"
                                className="bg-charcoal text-pearl rounded-full px-12 py-4 text-[11px] font-medium uppercase tracking-luxury hover:bg-gold transition-all shadow-luxury hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3">
                                <Save className="w-3.5 h-3.5" />
                                Update Storefront Canvas
                            </button>
                        </form>
                    </section>

                    {/* ── Brand Identity ── */}
                    <form action={updateStoreSettings}>
                        <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
                                <div className="flex mt-1 items-center gap-4">
                                    <Globe className="w-4 h-4 text-gold" />
                                    <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Brand Identity</h2>
                                </div>
                                <button type="submit"
                                    className="bg-pearl text-charcoal border border-charcoal/5 px-6 py-2.5 rounded-full shadow-sm hover:text-white hover:bg-gold text-[10px] uppercase tracking-luxury font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                                    <Save className="w-3.5 h-3.5" /> Save Brand Details
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Store Signature</label>
                                    <input
                                        name="name"
                                        type="text"
                                        defaultValue={storeInfo?.setting_value?.name || 'DINA COSMETIC'}
                                        required
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Primary Currency</label>
                                    <select name="currency" defaultValue={storeInfo?.setting_value?.currency || 'USD'}
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="USD">USD ($) — Universal</option>
                                        <option value="EUR">EUR (€) — Luxury Select</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Global Tagline</label>
                                <input
                                    name="tagline"
                                    type="text"
                                    defaultValue={storeInfo?.setting_value?.tagline || 'Luxury Obsidian Skincare'}
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="flex items-center justify-between p-8 bg-rose-50 border border-rose-100/50 rounded-xl shadow-inner-soft">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-widest text-charcoal font-bold">Vault Active Status</p>
                                    <p className="text-[9px] text-rose-500 uppercase tracking-luxury font-medium flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                        Emergency Kill Switch (Maintenance Mode)
                                    </p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="storeEnabled"
                                        defaultChecked={isEnabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-pearl peer-focus:outline-none rounded-full border border-charcoal/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-charcoal/30 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner group transition-all"></div>
                                </div>
                            </div>
                        </section>
                    </form>

                    {/* ── Menus & Socials ── */}
                    <form action={updateMenusAndSocials}>
                        <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
                                <div className="flex mt-1 items-center gap-4">
                                    <Layout className="w-4 h-4 text-gold" />
                                    <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Navigations & Socials</h2>
                                </div>
                                <button type="submit"
                                    className="bg-pearl text-charcoal border border-charcoal/5 px-6 py-2.5 rounded-full shadow-sm hover:text-white hover:bg-gold text-[10px] uppercase tracking-luxury font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                                    <Save className="w-3.5 h-3.5" /> Synchronize Menus
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Header Links</label>
                                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-bold tracking-widest uppercase">Live Link</span>
                                        </div>
                                        <textarea
                                            name="header_nav"
                                            defaultValue={headerNav?.menu_items ? JSON.stringify(headerNav.menu_items, null, 2) : '[\n  {"label":"Shop", "href":"/shop"}\n]'}
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md px-4 py-4 text-[11px] font-mono text-charcoal focus:border-gold/50 focus:ring-1 outline-none h-48 resize-none shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Legal Terms</label>
                                            <span className="text-[8px] bg-pearl text-textsoft/50 px-2 py-0.5 rounded border border-charcoal/10 font-bold tracking-widest uppercase">Footer Stack</span>
                                        </div>
                                        <textarea
                                            name="footer_legal"
                                            defaultValue={footerNav?.menu_items ? JSON.stringify(footerNav.menu_items, null, 2) : '[\n  {"label":"Privacy", "href":"/privacy"}\n]'}
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md px-4 py-4 text-[11px] font-mono text-charcoal focus:border-gold/50 focus:ring-1 outline-none h-48 resize-none shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-pearl/30 rounded-xl border border-charcoal/5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Instagram</label>
                                        <input name="instagram" type="text"
                                            defaultValue={socialMedia?.setting_value?.instagram || ''}
                                            placeholder="https://instagram.com/..."
                                            className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">TikTok</label>
                                        <input name="tiktok" type="text"
                                            defaultValue={socialMedia?.setting_value?.tiktok || ''}
                                            placeholder="https://tiktok.com/..."
                                            className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Facebook</label>
                                        <input name="facebook" type="text"
                                            defaultValue={socialMedia?.setting_value?.facebook || ''}
                                            placeholder="https://facebook.com/..."
                                            className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </form>

                </div>
            </div>
        </div>
    )
}
