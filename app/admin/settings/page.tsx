import { createClient } from '@/utils/supabase/server'
import { Save, ShieldCheck, Globe, CreditCard, Bell, Layout } from 'lucide-react'
import { updateStoreSettings } from './actions'
import { updateFrontendContent } from '../actions/frontend-actions'

export const dynamic = 'force-dynamic'

export default async function AdminSettings() {
    const supabase = await createClient()

    const { data: storeInfo } = await supabase.from('site_settings').select('*').eq('setting_key', 'store_info').single()
    const { data: storeStatus } = await supabase.from('site_settings').select('*').eq('setting_key', 'store_enabled').single()
    const { data: hero } = await supabase.from('frontend_content').select('*').eq('content_key', 'hero_main').single()

    const isEnabled = storeStatus?.setting_value ?? true

    return (
        <div className="space-y-12 pb-24">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-white mb-2 italic tracking-tight">Site Editor</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-[0.4em] font-medium">Unified Control & Identity</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    {[
                        { label: 'General Info', icon: Globe, active: true },
                        { label: 'Visual Storefront', icon: Layout },
                        { label: 'Security', icon: ShieldCheck },
                        { label: 'Payments', icon: CreditCard },
                    ].map((item) => (
                        <button key={item.label} type="button" className={`w-full flex items-center gap-4 px-6 py-4 border-l-2 transition-all ${item.active ? 'border-gold bg-white/5 text-gold' : 'border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-12">
                    {/* Visual Storefront Section */}
                    <section className="bg-zinc-950 border border-white/5 p-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Layout className="w-4 h-4 text-gold" />
                            <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Hero Masterpiece</h2>
                        </div>
                        <form action={async (formData) => {
                            "use server"
                            const title = formData.get("hero_title")
                            const subtitle = formData.get("hero_subtitle")
                            await updateFrontendContent('hero_main', { title, subtitle })
                        }} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Main Callout</label>
                                <textarea
                                    name="hero_title"
                                    defaultValue={hero?.content_data?.title || ''}
                                    className="w-full bg-zinc-900 border border-white/5 px-6 py-4 text-2xl font-serif text-white focus:border-gold/50 outline-none transition-all h-32 resize-none italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Subtext</label>
                                <input
                                    name="hero_subtitle"
                                    type="text"
                                    defaultValue={hero?.content_data?.subtitle || ''}
                                    className="w-full bg-zinc-900 border border-white/5 px-6 py-4 text-sm text-zinc-400 focus:border-gold/50 outline-none transition-all"
                                />
                            </div>
                            <button type="submit" className="bg-white/5 text-white border border-white/10 px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                Update Presence
                            </button>
                        </form>
                    </section>

                    {/* Brand Section */}
                    <form action={updateStoreSettings}>
                        <section className="bg-zinc-950 border border-white/5 p-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Brand Identity</h2>
                                <button type="submit" className="text-gold text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                                    <Save className="w-3 h-3" /> Save Changes
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Store Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        defaultValue={storeInfo?.setting_value?.name || 'DINA COSMETIC'}
                                        className="w-full bg-zinc-900 border border-white/5 px-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Primary Currency</label>
                                    <select name="currency" defaultValue={storeInfo?.setting_value?.currency || 'USD'} className="w-full bg-zinc-900 border border-white/5 px-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all">
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Store Tagline</label>
                                <input
                                    name="tagline"
                                    type="text"
                                    defaultValue={storeInfo?.setting_value?.tagline || 'Luxury Obsidian Skincare'}
                                    className="w-full bg-zinc-900 border border-white/5 px-6 py-3 text-sm text-white focus:border-gold/50 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-zinc-900/50 border border-white/5">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white font-bold">Store Activity Status</p>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Maintenance Mode (Emergency Kill Switch)</p>
                                </div>
                                <input
                                    type="checkbox"
                                    name="storeEnabled"
                                    defaultChecked={isEnabled}
                                    className="w-6 h-6 bg-zinc-950 border-gold/30 text-gold focus:ring-gold rounded cursor-pointer"
                                />
                            </div>
                        </section>
                    </form>

                    {/* Infrastructure */}
                    <section className="bg-zinc-950 border border-white/5 p-10 space-y-8">
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold border-b border-white/5 pb-4">Infrastructure</h2>
                        <div className="flex items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest text-emerald-500 font-bold">System Status: Optimal</p>
                                    <p className="text-[10px] text-emerald-500/60 mt-0.5">Stripe Webhooks & Supabase Engine Active</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
