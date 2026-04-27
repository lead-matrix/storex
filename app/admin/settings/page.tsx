import { createClient } from '@/lib/supabase/server'
import { Globe, Layout, Users, Truck, DollarSign, Package } from 'lucide-react'
import { updateStoreSettings, updateMenusAndSocials, updateShippingSettings, updateHomeSections, updateAnnouncementMessages } from '@/lib/actions/admin'
import MenuEditor from '@/components/admin/MenuEditor'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { BrandSettings } from '@/components/admin/BrandSettings'
import { SettingsSidebar } from '@/components/admin/SettingsSidebar'
import AnnouncementEditor from '@/components/admin/AnnouncementEditor'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
    const supabase = await createClient()

    const [
        { data: storeInfo },
        { data: storeStatus },
        { data: headerNav },
        { data: footerNav },
        { data: socialMedia },
        { data: shippingSettings },
        { data: homeSettings },
        { data: announcementMsgs },
    ] = await Promise.all([
        supabase.from('site_settings').select('*').eq('setting_key', 'store_info').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'store_enabled').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'header_main').maybeSingle(),
        supabase.from('navigation_menus').select('*').eq('menu_key', 'footer_legal').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'social_media').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'shipping_settings').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'home_sections').maybeSingle(),
        supabase.from('site_settings').select('*').eq('setting_key', 'announcement_messages').maybeSingle(),
    ])

    const isEnabled = storeStatus?.setting_value ?? true
    const shipping = shippingSettings?.setting_value || {}
    const homeConfig = homeSettings?.setting_value || {}
    const announcementMessages = announcementMsgs?.setting_value?.messages || ['Free shipping on all orders over $100']

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury">Site Settings</h1>
                    <p className="text-luxury-subtext text-xs uppercase tracking-luxury font-medium">Store Configuration &amp; Content Management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <SettingsSidebar />

                {/* Content */}
                <div className="lg:col-span-3 space-y-12">

                    {/* ── Brand & General ── */}
                    <section id="section-general" className="scroll-mt-32 space-y-12">
                        <BrandSettings 
                            initialData={{
                                name: storeInfo?.setting_value?.name || 'Dina Cosmetic',
                                tagline: storeInfo?.setting_value?.tagline || 'Premium Beauty Products',
                                currency: storeInfo?.setting_value?.currency || 'USD',
                                logo_url: storeInfo?.setting_value?.logo_url
                            }} 
                        />

                        <SettingsForm action={updateStoreSettings} title="Operational Status" iconName="globe">
                            <div className="flex items-center justify-between p-8 bg-rose-950/20 border border-rose-500/20 rounded-xl shadow-inner-soft">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-widest text-white font-bold">Store Status</p>
                                    <p className="text-[9px] text-rose-500 uppercase tracking-luxury font-medium flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                        Maintenance Mode Kill Switch
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="storeEnabled"
                                        defaultChecked={isEnabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-[#121214] peer-focus:outline-none rounded-full border border-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-charcoal/30 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner group transition-all"></div>
                                </label>
                            </div>
                        </SettingsForm>
                    </section>

                    {/* ── Home Page Sections ── */}
                    <section id="section-home" className="scroll-mt-32 space-y-12">
                        <SettingsForm action={updateHomeSections} title="Home Page Curation" iconName="monitor">
                            <p className="text-[11px] text-luxury-subtext leading-relaxed mb-6">
                                Control which sections currently appear on the index/front page.
                            </p>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-luxury font-bold text-white">Show Bestsellers in Hero</p>
                                            <p className="text-[9px] text-luxury-subtext leading-relaxed">Replace the top sale slider with bestsellers.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="show_bestsellers_hero" defaultChecked={homeConfig.show_bestsellers_hero === true} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-[#121214] peer-focus:outline-none rounded-full border border-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-charcoal/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold shadow-inner group transition-all"></div>
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-luxury font-bold text-white">Obsidian Bestsellers</p>
                                            <p className="text-[9px] text-luxury-subtext leading-relaxed">Show the horizontal scrolling carousel of best-selling items.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="show_bestsellers" defaultChecked={homeConfig.show_bestsellers !== false} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-[#121214] peer-focus:outline-none rounded-full border border-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-charcoal/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold shadow-inner group transition-all"></div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Carousel Heading</label>
                                            <input name="bestseller_heading" type="text" defaultValue={homeConfig.bestseller_heading || 'Obsidian Bestsellers'}
                                                className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Carousel Subheading</label>
                                            <input name="bestseller_subheading" type="text" defaultValue={homeConfig.bestseller_subheading || 'Most-loved by our community'}
                                                className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SettingsForm>
                    </section>

                    {/* ── Shipping Rate Settings ── */}
                    <section id="section-shipping" className="scroll-mt-32">
                        <SettingsForm action={updateShippingSettings} title="Shipping Rate Configuration" iconName="truck">
                            <p className="text-[11px] text-luxury-subtext leading-relaxed">
                                Configure the weight-based shipping prices shown to customers at checkout. Brackets are evaluated from lowest weight to highest. Set `max_lb` to 999 for the catch-all bracket.
                            </p>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-4 h-4 text-white" />
                                        <p className="text-[11px] uppercase tracking-luxury font-bold text-white">US Domestic Standard</p>
                                    </div>
                                    <input name="standard_label" type="text" defaultValue={shipping.standard_label ?? 'USPS Ground Advantage (3-5 Days)'}
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">
                                            Weight Brackets (JSON)
                                        </label>
                                        <p className="text-[10px] text-emerald-400/60 leading-relaxed mb-2">
                                            ✓ Format: [{`{ "max_lb": 0.5, "rate": 4.99 }`}, {`{ "max_lb": 1, "rate": 6.99 }`}, ...]<br/>
                                            ✓ Orders match the FIRST bracket where weight ≤ max_lb<br/>
                                            ✓ Always end with a catch-all: {`{ "max_lb": 999, "rate": 15.99 }`}<br/>
                                            ✓ Example: 0.8 lb cart matches the 1 lb bracket
                                        </p>
                                        <textarea name="weight_brackets" defaultValue={JSON.stringify(shipping.weight_brackets || [
                                            { max_lb: 0.5, rate: 4.99 },
                                            { max_lb: 1, rate: 6.99 },
                                            { max_lb: 2, rate: 8.99 },
                                            { max_lb: 5, rate: 12.99 },
                                            { max_lb: 999, rate: 15.99 }
                                        ], null, 2)}
                                        rows={6} className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs font-mono text-emerald-400 focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Free Shipping Threshold</label>
                                        <input name="free_shipping_threshold" type="number" step="0.01" defaultValue={shipping.free_shipping_threshold ?? '100'}
                                            className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-4 h-4 text-gold" />
                                        <p className="text-[11px] uppercase tracking-luxury font-bold text-white">US Domestic Express</p>
                                    </div>
                                    <input name="express_label" type="text" defaultValue={shipping.express_label ?? 'USPS Priority Mail (1-3 Days)'}
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all" />
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Weight Brackets (JSON) - Orders match FIRST bracket where weight ≤ max_lb</label>
                                        <textarea name="express_weight_brackets" defaultValue={JSON.stringify(shipping.express_weight_brackets || [
                                            { max_lb: 1, rate: 9.99 },
                                            { max_lb: 3, rate: 14.99 },
                                            { max_lb: 999, rate: 19.99 }
                                        ], null, 2)}
                                        rows={5} className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs font-mono text-emerald-400 focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-white" />
                                        <p className="text-[11px] uppercase tracking-luxury font-bold text-white">International Standard</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">International Std Brackets (JSON)</label>
                                        <textarea name="intl_weight_brackets" defaultValue={JSON.stringify(shipping.intl_weight_brackets || [
                                            { max_lb: 1, rate: 19.99 },
                                            { max_lb: 3, rate: 29.99 },
                                            { max_lb: 5, rate: 39.99 },
                                            { max_lb: 999, rate: 59.99 }
                                        ], null, 2)}
                                        rows={5} className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs font-mono text-emerald-400 focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-gold" />
                                        <p className="text-[11px] uppercase tracking-luxury font-bold text-white">International Express</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">International Express Brackets (JSON)</label>
                                        <textarea name="intl_express_weight_brackets" defaultValue={JSON.stringify(shipping.intl_express_weight_brackets || [
                                            { max_lb: 1, rate: 49.99 },
                                            { max_lb: 3, rate: 69.99 },
                                            { max_lb: 999, rate: 89.99 }
                                        ], null, 2)}
                                        rows={5} className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs font-mono text-emerald-400 focus:border-gold/50 outline-none transition-all" />
                                    </div>
                                </div>

                            </div>

                            <div className="flex items-start gap-3 p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl mt-6">
                                <DollarSign className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                                    Shipping rates are now fully dynamic and calculated live based on cart weight + location when requested at checkout. Admin can adjust these JSON boundaries anytime.
                                </p>
                            </div>
                        </SettingsForm>
                    </section>


                    {/* ── Menus & Socials ── */}
                    <section id="section-socials" className="scroll-mt-32">
                        <SettingsForm action={updateMenusAndSocials} title="Navigation & Social Links" iconName="layout">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Header Navigation</label>
                                    <MenuEditor name="header_nav" initialItems={headerNav?.menu_items || [{ label: 'Shop', href: '/shop' }]} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Footer legal Links</label>
                                    <MenuEditor name="footer_legal" initialItems={footerNav?.menu_items || [{ label: 'Privacy', href: '/privacy' }]} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-white/5 rounded-xl border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Instagram</label>
                                    <input name="instagram" type="text" defaultValue={socialMedia?.setting_value?.instagram || ''} placeholder="https://instagram.com/..."
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs text-white outline-none focus:border-gold/50 transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">TikTok</label>
                                    <input name="tiktok" type="text" defaultValue={socialMedia?.setting_value?.tiktok || ''} placeholder="https://tiktok.com/..."
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs text-white outline-none focus:border-gold/50 transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Facebook</label>
                                    <input name="facebook" type="text" defaultValue={socialMedia?.setting_value?.facebook || ''} placeholder="https://facebook.com/..."
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs text-white outline-none focus:border-gold/50 transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">YouTube</label>
                                    <input name="youtube" type="text" defaultValue={socialMedia?.setting_value?.youtube || ''} placeholder="https://youtube.com/@..."
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs text-white outline-none focus:border-gold/50 transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium">Pinterest</label>
                                    <input name="pinterest" type="text" defaultValue={socialMedia?.setting_value?.pinterest || ''} placeholder="https://pinterest.com/..."
                                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-md px-4 py-3 text-xs text-white outline-none focus:border-gold/50 transition-all shadow-sm" />
                                </div>
                            </div>
                        </SettingsForm>
                    </section>

                </div>
            </div>
        </div>
    )
}
