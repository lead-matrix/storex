import { createClient } from '@/lib/supabase/admin'
import { AlertTriangle, Eye, TrendingUp, Package, DollarSign, Users, ShoppingCart, Activity, RefreshCw, BarChart3, Clock, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── SVG Sales Sparkline (Refined for Luxury) ─────────────────────────
function LuxurySparkline({ data }: { data: number[] }) {
    const max = Math.max(...data, 1)
    const w = 400
    const h = 80
    const pad = 4
    const step = (w - pad * 2) / (data.length - 1)
    const points = data.map((v, i) => `${pad + i * step},${h - pad - ((v / max) * (h - pad * 2))}`).join(' ')

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 opacity-50">
            <polyline points={points} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    )
}

// ── KPI Card (Luxury) ────────────────────────────────────────────────
function KPICard({ label, value, subtext, icon: Icon, colorClass, sparkData }: any) {
    return (
        <div className="bg-obsidian border border-luxury-border rounded-luxury p-6 shadow-luxury group transition-all hover:border-gold/30">
            <div className="flex items-center justify-between mb-6">
                <div className={`p-2 rounded-sm bg-[#0B0B0D]/5 border border-white/10 ${colorClass}`}>
                    <Icon size={16} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                {sparkData && <LuxurySparkline data={sparkData} />}
            </div>
            <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-bold text-white/30">{label}</p>
                <p className="text-3xl font-serif text-white">{value}</p>
                <p className="text-[10px] text-gold/60 font-medium uppercase tracking-luxury">{subtext}</p>
            </div>
        </div>
    )
}

export default async function AdminDashboard() {
    const supabase = await createClient()

    // ── DATA ACQUISITION ──
    const [
        { data: alltimeStats },
        { data: sparklineData },
        { count: productsCount },
        { data: recentOrders },
        { data: lowStockProducts }
    ] = await Promise.all([
        supabase.rpc('admin_alltime_stats'),
        supabase.rpc('admin_revenue_sparkline'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('id, customer_email, status, amount_total, created_at').in('status', ['paid', 'shipped', 'delivered']).neq('customer_email', 'pending@stripe').order('created_at', { ascending: false }).limit(6),
        supabase.from('product_variants').select('id, name, product_id, products(title), stock').lt('stock', 10).order('stock', { ascending: true }).limit(5)
    ])

    const totalRevenue = Number(alltimeStats?.total_revenue || 0)
    const totalOrders = alltimeStats?.total_orders || 0
    const sparkData = sparklineData?.map((d: any) => Number(d.revenue)) || [0, 0, 0, 0, 0, 0, 0]
    const activeOrders = recentOrders?.filter(o => o.status === 'paid' || o.status === 'processing').length || 0


    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase text-shadow-gold">Dashboard</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Operations Overview · Real-Time Intelligence</p>
                </div>

                {/* QUICK ACTIONS PANEL */}
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/admin/products/new" className="flex items-center gap-2 bg-gold/10 border border-gold/30 px-4 py-2 rounded text-[9px] uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all font-bold">
                        <Plus size={14} />
                        New Product
                    </Link>
                    <Link href="/admin/builder" className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-4 py-2 rounded text-[9px] uppercase tracking-widest text-purple-300 hover:bg-purple-600 hover:text-white transition-all font-bold">
                    <span>🎨</span> Page Builder
                </Link>
                <Link href="/admin/orders" className="flex items-center gap-2 bg-[#0B0B0D]/5 border border-white/10 px-4 py-2 rounded text-[9px] uppercase tracking-widest text-white/70 hover:border-white/30 transition-all font-bold">
                        <ShoppingCart size={14} />
                        View Orders
                    </Link>
                    <button className="flex items-center gap-2 bg-[#0B0B0D]/5 border border-white/10 px-4 py-2 rounded text-[9px] uppercase tracking-widest text-white/50 hover:text-gold transition-all">
                        <RefreshCw className="w-3 h-3" />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Gross Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    subtext="All-time Registry"
                    icon={DollarSign}
                    colorClass="text-gold"
                    sparkData={sparkData}
                />
                <KPICard
                    label="Successful Orders"
                    value={totalOrders}
                    subtext={`${activeOrders} Recent Activity`}
                    icon={ShoppingCart}
                    colorClass="text-emerald-400"
                    sparkData={sparkData.slice(-7)} // Last 7 days
                />

                <KPICard
                    label="Product Vault"
                    value={productsCount ?? 0}
                    subtext="Unique Assets Live"
                    icon={Package}
                    colorClass="text-blue-400"
                />
                <KPICard
                    label="Low Inventory"
                    value={lowStockProducts?.length ?? 0}
                    subtext="Replenishment Required"
                    icon={AlertTriangle}
                    colorClass="text-red-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── RECENT REGISTRY ── */}
                <div className="lg:col-span-2 bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-[11px] uppercase tracking-luxury font-bold text-gold">Recent Transactions</h3>
                        <Link href="/admin/orders" className="text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                            Full Registry <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-white/5">
                                {recentOrders?.map((order) => (
                                    <tr key={order.id} className="hover:bg-[#0B0B0D]/5 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[10px] text-gold font-bold">
                                                    #{order.id.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] text-white font-medium truncate max-w-[150px]">{order.customer_email || 'Guest'}</p>
                                                    <p className="text-[9px] text-white/30 uppercase tracking-luxury">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`text-[8px] uppercase tracking-luxury font-bold px-2 py-0.5 rounded border ${order.status === 'paid' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-amber-950/40 text-amber-400 border-amber-800/50'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className="text-xs font-serif text-white">${Number(order.amount_total).toFixed(2)}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── STOCK ALERTS ── */}
                <div className="bg-obsidian border border-luxury-border rounded-luxury flex flex-col">
                    <div className="px-8 py-6 border-b border-white/5">
                        <h3 className="text-[11px] uppercase tracking-luxury font-bold text-red-400 flex items-center gap-3">
                            <Activity size={14} /> Critical Replenishment
                        </h3>
                    </div>
                    <div className="p-6 space-y-4 flex-grow">
                        {lowStockProducts?.map((variant: any) => (
                            <div key={variant.id} className="flex items-center justify-between p-4 bg-[#0B0B0D]/5 border border-white/10 rounded-sm hover border-gold/20 transition-all group">
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white font-medium truncate group-hover:text-gold transition-colors">
                                        {variant.products?.title} ({variant.name})
                                    </p>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Remaining: {variant.stock ?? 0}</p>
                                </div>
                                <Link href="/admin/products" className="p-2 bg-black/40 text-white/30 hover:text-gold transition-colors">
                                    <BarChart3 size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                    <Link href="/admin/products" className="px-8 py-4 border-t border-white/5 text-[9px] uppercase tracking-widest text-center text-white/20 hover:text-gold transition-colors">
                        Inspect Collection Assets
                    </Link>
                </div>
            </div>
        </div>
    )
}
