import { createClient } from '@/utils/supabase/server'
import {
    Package, ShoppingCart, DollarSign, TrendingUp,
    Plus, ArrowRight, AlertTriangle, CheckCircle2,
    Users, Layers, Settings, Zap
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminCommandCenter() {
    const supabase = await createClient()

    // Fetch all stats in parallel — using REAL DB column names (audited)
    const [
        { data: revenueData },
        { count: totalOrders },
        { count: lowStockCount },
        { count: totalProducts },
        { count: totalUsers },
        { data: recentOrders },
        { data: lowStockProducts },
    ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('inventory', 5).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders')
            .select('id, email, status, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(8),
        supabase.from('products')
            .select('id, name, inventory')
            .lt('inventory', 5)
            .eq('is_active', true)
            .order('inventory', { ascending: true })
            .limit(5),
    ])

    const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0

    const statCards = [
        {
            label: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/5',
            border: 'border-emerald-500/10',
            glow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.08)]',
        },
        {
            label: 'Total Orders',
            value: (totalOrders ?? 0).toLocaleString(),
            icon: ShoppingCart,
            color: 'text-blue-400',
            bg: 'bg-blue-500/5',
            border: 'border-blue-500/10',
            glow: 'group-hover:shadow-[0_0_30px_rgba(96,165,250,0.08)]',
        },
        {
            label: 'Active Products',
            value: (totalProducts ?? 0).toLocaleString(),
            icon: Package,
            color: 'text-gold-primary',
            bg: 'bg-gold-primary/5',
            border: 'border-gold-primary/10',
            glow: 'group-hover:shadow-[0_0_30px_rgba(212,175,55,0.08)]',
        },
        {
            label: 'Clientele',
            value: (totalUsers ?? 0).toLocaleString(),
            icon: Users,
            color: 'text-purple-400',
            bg: 'bg-purple-500/5',
            border: 'border-purple-500/10',
            glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]',
        },
    ]

    const quickActions = [
        { label: 'New Product', href: '/admin/products/new', icon: Plus, desc: 'Add to inventory' },
        { label: 'Fulfillment', href: '/admin/orders', icon: ShoppingCart, desc: 'Process orders' },
        { label: 'Categories', href: '/admin/categories', icon: Layers, desc: 'Manage collections' },
        { label: 'Site Editor', href: '/admin/settings', icon: Settings, desc: 'Control appearance' },
    ]

    const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
        paid: { label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
        shipped: { label: 'Shipped', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
        pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
        cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
        delivered: { label: 'Delivered', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
        refunded: { label: 'Refunded', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' },
    }

    return (
        <div className="space-y-10 pb-24">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.5em] text-gold-primary/60 font-light mb-2">
                        Obsidian Palace · Operations
                    </p>
                    <h1 className="text-3xl md:text-4xl font-serif text-text-headingDark italic tracking-tight">
                        Command Center
                    </h1>
                </div>
                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-2 bg-gold-primary text-background-primary px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-gold-hover transition-all active:scale-95 shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Forge Product
                </Link>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`group relative ${stat.bg} border ${stat.border} p-7 transition-all duration-500 overflow-hidden ${stat.glow}`}
                    >
                        {/* Decorative corner */}
                        <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className={`absolute top-0 right-0 w-full h-full ${stat.bg} blur-xl`} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-5">
                                <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
                                <ArrowRight className={`w-3 h-3 ${stat.color} opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all duration-300`} />
                            </div>
                            <p className={`text-3xl font-serif ${stat.color} mb-1 tracking-tight`}>{stat.value}</p>
                            <p className="text-[9px] text-text-mutedDark/60 uppercase tracking-[0.35em] font-bold">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Middle Row: Quick Actions + Low Stock Alert ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions */}
                <div className="lg:col-span-2">
                    <div className="bg-background-secondary/20 border border-gold-primary/8 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gold-primary/8 flex items-center gap-3">
                            <Zap className="w-3.5 h-3.5 text-gold-primary/60" />
                            <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/60 font-bold">
                                Quick Actions
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4">
                            {quickActions.map((action, i) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className={`group flex flex-col items-center justify-center gap-3 p-8 hover:bg-gold-primary/5 transition-all duration-300 ${i < 3 ? 'border-r border-gold-primary/8' : ''}`}
                                >
                                    <div className="w-10 h-10 border border-gold-primary/15 flex items-center justify-center group-hover:border-gold-primary/40 group-hover:bg-gold-primary/10 transition-all duration-300">
                                        <action.icon className="w-4 h-4 text-text-mutedDark/50 group-hover:text-gold-primary transition-colors duration-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-text-bodyDark/70 group-hover:text-text-headingDark transition-colors font-medium">
                                            {action.label}
                                        </p>
                                        <p className="text-[9px] text-text-mutedDark/40 mt-0.5">{action.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-background-secondary/20 border border-amber-500/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-amber-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
                            <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/60 font-bold">
                                Low Stock
                            </h2>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5">
                            {lowStockCount ?? 0}
                        </span>
                    </div>
                    <div className="divide-y divide-amber-500/5">
                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            lowStockProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-amber-500/5 transition-colors group"
                                >
                                    <p className="text-[11px] text-text-bodyDark/70 group-hover:text-text-headingDark transition-colors truncate max-w-[140px]">
                                        {product.name}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 border shrink-0 ${product.inventory === 0 ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                                        {product.inventory === 0 ? 'OUT' : `${product.inventory} left`}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400/40" />
                                <p className="text-[10px] text-text-mutedDark/30 uppercase tracking-widest">
                                    All stocked
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent Orders Table ── */}
            <div className="bg-background-secondary/20 border border-gold-primary/8 overflow-hidden">
                <div className="px-6 md:px-8 py-5 border-b border-gold-primary/8 flex items-center justify-between">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/60 font-bold">
                        Recent Transactions
                    </h2>
                    <Link
                        href="/admin/orders"
                        className="text-[9px] uppercase tracking-[0.3em] text-gold-primary/70 hover:text-gold-primary transition-colors flex items-center gap-1.5"
                    >
                        View All <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/4 text-[9px] uppercase tracking-[0.3em] text-text-mutedDark/40">
                                <th className="px-6 md:px-8 py-3 font-bold">Reference</th>
                                <th className="px-6 md:px-8 py-3 font-bold hidden sm:table-cell">Customer</th>
                                <th className="px-6 md:px-8 py-3 font-bold">Status</th>
                                <th className="px-6 md:px-8 py-3 font-bold hidden md:table-cell">Date</th>
                                <th className="px-6 md:px-8 py-3 font-bold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders?.map((order) => {
                                const sc = statusConfig[order.status] || statusConfig['pending']
                                return (
                                    <tr
                                        key={order.id}
                                        className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors group"
                                    >
                                        <td className="px-6 md:px-8 py-5">
                                            <span className="font-mono text-[10px] text-text-mutedDark/50 group-hover:text-gold-primary transition-colors">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 hidden sm:table-cell">
                                            <span className="text-[11px] text-text-bodyDark/60 lowercase truncate max-w-[180px] block">
                                                {order.email || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5">
                                            <span className={`text-[9px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 border ${sc.color} ${sc.bg} ${sc.border}`}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-[10px] text-text-mutedDark/40 hidden md:table-cell">
                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-right text-[12px] font-serif text-text-headingDark/80 italic">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            })}
                            {(!recentOrders || recentOrders.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <p className="text-[10px] uppercase tracking-[0.5em] text-text-mutedDark/20">
                                            No transactions recorded yet
                                        </p>
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
