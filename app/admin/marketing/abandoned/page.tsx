import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, Mail, Trash2, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { triggerRecoveryEmail, deleteAbandonedCart } from '@/lib/actions/recovery'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Abandoned Carts | Admin' }

export default async function AbandonedCartsPage() {
    const supabase = await createClient()
    const { data: carts } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('last_active', { ascending: false })

    const totalAbandoned = carts?.length || 0
    const recoveredCount = carts?.filter(c => c.status === 'recovered').length || 0
    const recoveryRate = totalAbandoned > 0 ? (recoveredCount / totalAbandoned) * 100 : 0

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/marketing" className="text-[10px] uppercase tracking-widest text-white/40 hover:text-gold transition-all">Marketing</Link>
                        <ArrowRight size={10} className="text-white/20" />
                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Abandoned Carts</span>
                    </div>
                    <h1 className="text-4xl font-serif text-white mb-2 tracking-luxury uppercase">Ghost Inventory</h1>
                    <p className="text-white/40 text-xs uppercase tracking-luxury font-medium">Cart Recovery Intelligence · Revenue Reclamation</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-obsidian px-6 py-4 rounded-luxury border border-white/10 shadow-luxury">
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Recovery Rate</p>
                        <p className="text-2xl font-serif text-white">{recoveryRate.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            <div className="bg-obsidian rounded-luxury shadow-luxury border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-luxury text-white/40 font-bold">
                                <th className="px-8 py-5">Identified Client</th>
                                <th className="px-8 py-5">Artifacts Left</th>
                                <th className="px-8 py-5 text-center">Value</th>
                                <th className="px-8 py-5 text-center">Last Active</th>
                                <th className="px-8 py-5 text-right">Recovery Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-white/60 font-medium">
                            {carts?.map((cart) => (
                                <tr key={cart.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group ${cart.status === 'recovered' ? 'opacity-30' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <Mail size={12} className={cart.status === 'emailed' ? 'text-gold' : 'text-white/40'} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{cart.customer_email}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-white/30">{cart.status}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-[200px] truncate text-white/50">
                                            {cart.items?.map((i: any) => i.name || i.title).join(', ')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center font-serif text-white">
                                        ${Number(cart.amount_total).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-white/40">
                                            <Clock size={12} />
                                            <span>{new Date(cart.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {cart.status !== 'recovered' && (
                                                <form action={async () => { "use server"; await triggerRecoveryEmail(cart.id); }}>
                                                    <button type="submit" className="bg-gold text-black px-4 py-2 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2">
                                                        <Mail size={12} />
                                                        Dispatch Recovery
                                                    </button>
                                                </form>
                                            )}
                                            <form action={async () => { "use server"; await deleteAbandonedCart(cart.id); }}>
                                                <button type="submit" className="text-white/20 hover:text-red-500 p-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!carts || carts.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <ShoppingCart className="w-12 h-12 text-white/10" />
                                            <p className="text-white/30 text-[10px] uppercase tracking-luxury">No ghost inventory detected in the palace.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
