import { createClient } from '@/lib/supabase/server'
import { Plus, Ticket, Trash2, ToggleLeft, ToggleRight, Calendar, Info, ShoppingCart } from 'lucide-react'
import { createCoupon, toggleCouponStatus, deleteCoupon } from '@/lib/actions/coupons'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Coupons | Admin' }

export default async function MarketingCoupons() {
    const supabase = await createClient()
    const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Promotional Vault</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Discount Architecture & Coupon Codes</p>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/marketing/abandoned"
                        className="bg-white px-6 py-3 rounded-luxury border border-charcoal/10 text-[10px] uppercase tracking-widest font-bold text-textsoft hover:text-gold hover:border-gold/30 transition-all shadow-soft flex items-center gap-2"
                    >
                        <ShoppingCart size={14} />
                        Ghost Inventory
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-luxury border border-charcoal/10 shadow-soft">
                    <form action={createCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Coupon Code</label>
                            <input name="code" placeholder="e.g. ROYAL20" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Discount Type</label>
                            <select name="discount_type" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed_amount">Fixed Amount ($)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Value</label>
                            <input name="discount_value" type="number" step="0.01" placeholder="20" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Min Purchase ($)</label>
                            <input name="min_purchase_amount" type="number" step="0.01" placeholder="0" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Max Uses</label>
                            <input name="max_uses" type="number" placeholder="Unlimited" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Expiry Date</label>
                            <input name="expires_at" type="date" className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold/50" />
                        </div>
                        <div className="lg:col-span-3 pt-2">
                            <button type="submit" className="w-full bg-charcoal text-pearl rounded py-3 text-[11px] font-bold uppercase tracking-luxury hover:bg-gold transition-all flex items-center justify-center gap-2">
                                <Plus size={14} />
                                Forge New Coupon
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {coupons?.map((coupon) => (
                    <div key={coupon.id} className="bg-white rounded-luxury border border-charcoal/10 p-6 shadow-soft hover:shadow-luxury transition-all group overflow-hidden relative">
                        {/* Background Code Watermark */}
                        <div className="absolute -right-4 -top-4 opacity-[0.03] text-5xl font-black rotate-12 select-none group-hover:text-gold transition-colors">{coupon.code}</div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-heading text-charcoal tracking-widest">{coupon.code}</h3>
                                <p className="text-[10px] text-gold font-bold uppercase tracking-luxury mt-1">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <form action={async () => { "use server"; await toggleCouponStatus(coupon.id, coupon.status); }}>
                                    <button className={`transition-all ${coupon.status === 'active' ? "text-emerald-500" : "text-textsoft/30"}`}>
                                        {coupon.status === 'active' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </form>
                                <form action={async () => { "use server"; await deleteCoupon(coupon.id); }}>
                                    <button className="text-textsoft hover:text-red-500 p-1 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[11px] text-textsoft">
                                <span className="uppercase tracking-widest opacity-60">Used Inventory</span>
                                <span className="font-mono text-charcoal font-bold">
                                    {coupon.used_count} / {coupon.max_uses || '∞'}
                                </span>
                            </div>

                            <div className="w-full h-1 bg-pearl rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold transition-all duration-500"
                                    style={{ width: `${coupon.max_uses ? (coupon.used_count / coupon.max_uses) * 100 : 0}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-charcoal/5">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-luxury text-textsoft/60">
                                        <Info size={10} /> Threshold
                                    </div>
                                    <p className="text-xs font-serif text-charcoal font-medium">${coupon.min_purchase_amount || '0'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-luxury text-textsoft/60">
                                        <Calendar size={10} /> Validity
                                    </div>
                                    <p className="text-xs font-serif text-charcoal font-medium">
                                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Infinite'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {(!coupons || coupons.length === 0) && (
                    <div className="col-span-full py-24 text-center border border-dashed border-charcoal/10 rounded-luxury">
                        <div className="flex flex-col items-center gap-4">
                            <Ticket className="w-12 h-12 text-pearl/20" />
                            <p className="text-textsoft text-[10px] uppercase tracking-luxury">No promotional codes discovered in the vault.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
