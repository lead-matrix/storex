import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { Mail, Download, Users, ArrowRight, Calendar, Trash2 } from 'lucide-react'
import { deleteSubscriber } from '@/lib/actions/newsletter'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Newsletter Subscribers | Admin' }

export default async function NewsletterSubscribersPage() {
    // Use admin client so RLS doesn't block
    const supabase = await createAdminClient()

    const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: stats } = await supabase.rpc('get_subscriber_stats')
    const total = stats?.total_subscribers || 0
    const thisMonth = stats?.new_this_month || 0


    return (
        <div className="space-y-10 pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/marketing" className="text-[10px] uppercase tracking-widest text-white/30 hover:text-gold transition-all">Marketing</Link>
                        <ArrowRight size={10} className="text-white/20" />
                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Subscribers</span>
                    </div>
                    <h1 className="text-4xl font-serif text-white tracking-luxury uppercase">Newsletter Vault</h1>
                    <p className="text-white/30 text-xs uppercase tracking-luxury font-medium mt-1">Email List Intelligence · Inner Circle Members</p>
                </div>

                {/* Stats + Export */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Total</p>
                        <p className="text-2xl font-serif text-white">{total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">This Month</p>
                        <p className="text-2xl font-serif text-gold">{thisMonth}</p>
                    </div>
                    <a
                        href="/api/admin/newsletter/export"
                        className="flex items-center gap-2 bg-gold text-black px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-luxury hover:bg-yellow-400 transition-all shadow-lg"
                    >
                        <Download size={14} />
                        Export CSV
                    </a>
                </div>
            </div>

            {/* Empty state */}
            {(!subscribers || subscribers.length === 0) && (
                <div className="py-24 border border-dashed border-white/10 rounded-2xl text-center">
                    <Mail className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 text-sm">No subscribers yet.</p>
                    <p className="text-white/20 text-xs mt-1">They'll appear here as customers sign up from the storefront.</p>
                </div>
            )}

            {/* Table */}
            {subscribers && subscribers.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-luxury text-white/30 font-bold">#</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-luxury text-white/30 font-bold">Email</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-luxury text-white/30 font-bold">Subscribed</th>
                                    <th className="px-6 py-4 text-[9px] uppercase tracking-luxury text-white/30 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map((sub, i) => (
                                    <tr key={sub.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-[11px] font-mono text-white/20">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={11} className="text-gold" />
                                                </div>
                                                <span className="text-white text-[12px] font-medium">{sub.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white/40 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={10} className="text-white/20" />
                                                {new Date(sub.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={async () => {
                                                'use server'
                                                await deleteSubscriber(sub.id)
                                            }}>
                                                <button
                                                    type="submit"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/20 hover:text-red-400 rounded-lg"
                                                    title="Remove subscriber"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-between">
                        <p className="text-[10px] text-white/20 uppercase tracking-wider">{total} total subscribers</p>
                        <a
                            href="/api/admin/newsletter/export"
                            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-gold transition-colors uppercase tracking-wider"
                        >
                            <Download size={11} />
                            Export all as CSV
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
