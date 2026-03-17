import { createClient } from '@/lib/supabase/server'
import { Globe, Layout, Users, Truck, DollarSign, Package } from 'lucide-react'
import { updateStoreSettings, updateHeroContent, updateMenusAndSocials, updateShippingSettings } from '@/lib/actions/admin'
import HeroSlidesEditor from '@/components/admin/HeroSlidesEditor'
import MenuEditor from '@/components/admin/MenuEditor'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { BrandSettings } from '@/components/admin/BrandSettings'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
    const supabase = await createClient()

    const [
        { data: storeInfo },
        { data: storeStatus },
        { data: heroSlides },
        { data: headerNav },
        { data: footerNav },
        { data: socialMedia },
        { data: shippingSettings },
    ] = await Promise.all([
        supabase.from('site_settings').select('*').eq('setting_key', 'store_info').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'store_enabled').maybeSingle(),
        supabase.from('frontend_content').select('*').eq('content_key', 'hero_slides').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'header_main').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'footer_legal').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'social_media').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'shipping_settings').maybeSingle(),
    ])

    const isEnabled = storeStatus?.setting_value ?? true
    const shipping = shippingSettings?.setting_value || {}

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            {/* Page Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Site Settings</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Store Configuration &amp; Content Management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar nav */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { label: 'General Info', icon: Globe, active: true },
                        { label: 'Shipping Rates', icon: Truck },
                        { label: 'Visual Storefront', icon: Layout },
                        { label: 'Socials', icon: Users },
                    ].map((item: any) => (
                        <button key={item.label} type="button"
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-md transition-all ${item.active ? 'bg-pearl text-gold shadow-sm' : 'bg-transparent text-textsoft hover:text-charcoal hover:bg-gold/5'}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] uppercase tracking-luxury font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-12">

                    {/* ── Brand & General ── */}
                    {/* ── Brand & General ── */}
                    <BrandSettings 
                        initialData={{
                            name: storeInfo?.setting_value?.name || 'Dina Cosmetic',
                            tagline: storeInfo?.setting_value?.tagline || 'Premium Beauty Products',
                            currency: storeInfo?.setting_value?.currency || 'USD',
                            logo_url: storeInfo?.setting_value?.logo_url
                        }} 
                    />

                    <SettingsForm action={updateStoreSettings} title="Operational Status" iconName="globe">
                        <div className="flex items-center justify-between p-8 bg-rose-50 border border-rose-100/50 rounded-xl shadow-inner-soft">
                            <div className="space-y-1">
                                <p className="text-[11px] uppercase tracking-widest text-charcoal font-bold">Store Status</p>
                                <p className="text-[9px] text-rose-500 uppercase tracking-luxury font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                    Maintenance Mode Kill Switch
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
                    </SettingsForm>

                    {/* ── Shipping Rate Settings ── */}
                    <SettingsForm action={updateShippingSettings} title="Shipping Rate Configuration" iconName="truck">
                        <p className="text-[11px] text-textsoft/70 leading-relaxed">
                            Configure flat-rate fallback prices for Standard and Express shipping. These are used when live Shippo rates are unavailable.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-pearl/60 rounded-xl border border-charcoal/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Package className="w-4 h-4 text-charcoal" />
                                    <p className="text-[11px] uppercase tracking-luxury font-bold text-charcoal">Standard</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textsoft text-sm">$</span>
                                    <input name="standard_rate" type="number" step="0.01" defaultValue={shipping.standard_rate ?? '7.99'}
                                        className="w-full bg-white border border-charcoal/10 rounded-md pl-8 pr-4 py-3 text-sm text-charcoal focus:border-gold/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Free Shipping Threshold</label>
                                    <input name="free_shipping_threshold" type="number" step="0.01" defaultValue={shipping.free_shipping_threshold ?? '100'}
                                        className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-sm text-charcoal focus:border-gold/50 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="p-6 bg-pearl/60 rounded-xl border border-charcoal/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Truck className="w-4 h-4 text-gold" />
                                    <p className="text-[11px] uppercase tracking-luxury font-bold text-charcoal">Express</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textsoft text-sm">$</span>
                                    <input name="express_rate" type="number" step="0.01" defaultValue={shipping.express_rate ?? '19.99'}
                                        className="w-full bg-white border border-charcoal/10 rounded-md pl-8 pr-4 py-3 text-sm text-charcoal focus:border-gold/50 outline-none transition-all" />
                                </div>
                                <input name="express_label" type="text" defaultValue={shipping.express_label ?? 'Express Shipping'}
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-sm text-charcoal focus:border-gold/50 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <DollarSign className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-emerald-600/80 leading-relaxed">
                                Live Shippo rates are active. The flat rates above are used as fallback if carrier services are unreachable.
                            </p>
                        </div>
                    </SettingsForm>

                    {/* ── Hero Slides ── */}
                    <SettingsForm action={updateHeroContent} title="Hero Slides & Banners" iconName="layout">
                        <HeroSlidesEditor initialSlides={heroSlides?.content_data?.slides || []} />
                    </SettingsForm>

                    {/* ── Menus & Socials ── */}
                    <SettingsForm action={updateMenusAndSocials} title="Navigation & Social Links" iconName="layout">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Header Navigation</label>
                                <MenuEditor name="header_nav" initialItems={headerNav?.menu_items || [{ label: 'Shop', href: '/shop' }]} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Footer legal Links</label>
                                <MenuEditor name="footer_legal" initialItems={footerNav?.menu_items || [{ label: 'Privacy', href: '/privacy' }]} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-pearl/30 rounded-xl border border-charcoal/5">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Instagram</label>
                                <input name="instagram" type="text" defaultValue={socialMedia?.setting_value?.instagram || ''} placeholder="https://instagram.com/..."
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">TikTok</label>
                                <input name="tiktok" type="text" defaultValue={socialMedia?.setting_value?.tiktok || ''} placeholder="https://tiktok.com/..."
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Facebook</label>
                                <input name="facebook" type="text" defaultValue={socialMedia?.setting_value?.facebook || ''} placeholder="https://facebook.com/..."
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-3 text-xs text-charcoal outline-none focus:border-gold/50 transition-all shadow-sm" />
                            </div>
                        </div>
                    </SettingsForm>

                </div>
            </div>
        </div>
    )
}
