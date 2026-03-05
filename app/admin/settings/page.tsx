import { createClient } from '@/utils/supabase/server'
import { Save, ShieldCheck, Globe, CreditCard, Layout } from 'lucide-react'
import { updateStoreSettings, updateHeroContent, updateMenusAndSocials } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
    const supabase = await createClient()

    const [
        { data: storeInfo },
        { data: storeStatus },
        { data: hero },
        { data: headerNav },
        { data: footerNav },
        { data: socialMedia },
    ] = await Promise.all([
        supabase.from('site_settings').select('*').eq('setting_key', 'store_info').single(),
        supabase.from('site_settings').select('*').eq('setting_key', 'store_enabled').single(),
        supabase.from('frontend_content').select('*').eq('content_key', 'hero_main').single(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'header_main').single(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'footer_legal').single(),
        supabase.from('site_settings').select('*').eq('setting_key', 'social_media').single(),
    ])

    const isEnabled = storeStatus?.setting_value ?? true

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Site Editor</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Unified Control &amp; Identity</p>
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
                        <div className="flex items-center gap-4 border-b border-charcoal/10 pb-4">
                            <Layout className="w-4 h-4 text-gold" />
                            <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Hero Masterpiece</h2>
                        </div>
                        <form action={updateHeroContent} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Main Callout</label>
                                <textarea
                                    name="hero_title"
                                    defaultValue={hero?.content_data?.title || ''}
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-4 text-2xl font-heading text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all h-32 resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Subtext</label>
                                <input
                                    name="hero_subtitle"
                                    type="text"
                                    defaultValue={hero?.content_data?.subtitle || ''}
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-4 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                                />
                            </div>
                            <button type="submit"
                                className="bg-charcoal text-pearl rounded-full px-8 py-3 text-[11px] font-medium uppercase tracking-luxury hover:bg-gold transition-all shadow-soft hover:shadow-luxury">
                                Update Presence
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
                                    className="text-charcoal bg-pearl px-4 py-2 rounded-full shadow-sm hover:text-white hover:bg-gold text-[10px] uppercase tracking-luxury font-medium flex items-center gap-2 transition-colors">
                                    <Save className="w-3 h-3" /> Save Changes
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Store Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        defaultValue={storeInfo?.setting_value?.name || 'DINA COSMETIC'}
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Primary Currency</label>
                                    <select name="currency" defaultValue={storeInfo?.setting_value?.currency || 'USD'}
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all">
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Store Tagline</label>
                                <input
                                    name="tagline"
                                    type="text"
                                    defaultValue={storeInfo?.setting_value?.tagline || 'Luxury Obsidian Skincare'}
                                    className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-sm text-charcoal focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-red-50/50 border border-red-100 rounded-md">
                                <div>
                                    <p className="text-[10px] uppercase tracking-luxury text-charcoal font-medium">Store Activity Status</p>
                                    <p className="text-[9px] text-red-500 uppercase tracking-luxury mt-1 font-medium">Maintenance Mode (Emergency Kill Switch)</p>
                                </div>
                                <input
                                    type="checkbox"
                                    name="storeEnabled"
                                    defaultChecked={isEnabled}
                                    className="w-6 h-6 bg-white border-charcoal/20 text-gold focus:ring-gold rounded cursor-pointer"
                                />
                            </div>
                        </section>
                    </form>

                    {/* ── Infrastructure ── */}
                    <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-charcoal/10 pb-4">
                            <ShieldCheck className="w-4 h-4 text-gold" />
                            <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Infrastructure</h2>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-luxury text-emerald-700 font-medium">System Status: Optimal</p>
                                    <p className="text-[10px] text-emerald-600/70 mt-0.5 uppercase tracking-luxury">Stripe Webhooks &amp; Supabase Engine Active</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Menus & Socials ── */}
                    <form action={updateMenusAndSocials}>
                        <section className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
                                <div className="flex mt-1 items-center gap-4">
                                    <Layout className="w-4 h-4 text-gold" />
                                    <h2 className="text-[10px] uppercase tracking-luxury text-textsoft font-medium">Menus &amp; Socials</h2>
                                </div>
                                <button type="submit"
                                    className="text-charcoal bg-pearl px-4 py-2 rounded-full shadow-sm hover:text-white hover:bg-gold text-[10px] uppercase tracking-luxury font-medium flex items-center gap-2 transition-colors">
                                    <Save className="w-3 h-3" /> Update Menus
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Header Links (JSON)</label>
                                    <textarea
                                        name="header_nav"
                                        defaultValue={headerNav?.menu_items ? JSON.stringify(headerNav.menu_items, null, 2) : '[\n  {"label":"Shop", "href":"/shop"}\n]'}
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-4 text-sm font-mono text-charcoal focus:border-gold/50 focus:ring-1 outline-none h-32 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Footer Legal Links (JSON)</label>
                                    <textarea
                                        name="footer_legal"
                                        defaultValue={footerNav?.menu_items ? JSON.stringify(footerNav.menu_items, null, 2) : '[\n  {"label":"Privacy", "href":"/privacy"}\n]'}
                                        className="w-full bg-pearl border border-charcoal/10 rounded-md px-6 py-4 text-sm font-mono text-charcoal focus:border-gold/50 focus:ring-1 outline-none h-32 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Instagram URL</label>
                                        <input name="instagram" type="text"
                                            defaultValue={socialMedia?.setting_value?.instagram || ''}
                                            placeholder="https://instagram.com/..."
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">TikTok URL</label>
                                        <input name="tiktok" type="text"
                                            defaultValue={socialMedia?.setting_value?.tiktok || ''}
                                            placeholder="https://tiktok.com/..."
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Facebook URL</label>
                                        <input name="facebook" type="text"
                                            defaultValue={socialMedia?.setting_value?.facebook || ''}
                                            placeholder="https://facebook.com/..."
                                            className="w-full bg-pearl border border-charcoal/10 rounded-md px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50 transition-all"
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
