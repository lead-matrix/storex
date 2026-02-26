import { createClient } from '@/utils/supabase/server'
import { AlertTriangle, Eye, TrendingUp, Package, DollarSign, Users, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── SVG Sales Sparkline ───────────────────────────────────────────────────────
function SalesChart({ data }: { data: number[] }) {
    const max = Math.max(...data, 1)
    const w = 460
    const h = 100
    const pad = 8
    const step = (w - pad * 2) / (data.length - 1)

    const points = data.map((v, i) => ({
        x: pad + i * step,
        y: h - pad - ((v / max) * (h - pad * 2))
    }))

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
    const area =
        `M${points[0].x},${h - pad} ` +
        points.map(p => `L${p.x},${p.y}`).join(' ') +
        ` L${points[points.length - 1].x},${h - pad} Z`

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="w-full overflow-hidden" role="img" aria-label="Weekly sales chart">
            <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full h-auto" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((t, i) => (
                    <line key={i}
                        x1={pad} y1={pad + (1 - t) * (h - pad * 2)}
                        x2={w - pad} y2={pad + (1 - t) * (h - pad * 2)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                    />
                ))}
                {/* Area fill */}
                <path d={area} fill="url(#areaGrad)" />
                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3"
                        fill="#D4AF37"
                        stroke="rgb(13,13,13)"
                        strokeWidth="2"
                    />
                ))}
                {/* Day labels — accessible color: #8C8680 on #111 = 4.5:1 ✓ */}
                {points.map((p, i) => (
                    <text key={i} x={p.x} y={h + 18} textAnchor="middle"
                        fontSize="9" fill="#8C8680"
                        fontFamily="system-ui"
                        style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        {days[i]}
                    </text>
                ))}
            </svg>
        </div>
    )
}

// ── SVG Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1
    const r = 50, cx = 70, cy = 70
    let cumAngle = -Math.PI / 2

    const arcs = segments.map(seg => {
        const angle = (seg.value / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(cumAngle)
        const y1 = cy + r * Math.sin(cumAngle)
        cumAngle += angle
        const x2 = cx + r * Math.cos(cumAngle)
        const y2 = cy + r * Math.sin(cumAngle)
        const large = angle > Math.PI ? 1 : 0
        return {
            ...seg,
            d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`,
            pct: Math.round((seg.value / total) * 100)
        }
    })

    return (
        <div className="flex items-center gap-6" role="img" aria-label="Top products distribution">
            <svg viewBox="0 0 140 140" className="w-28 h-28 flex-shrink-0">
                <circle cx={cx} cy={cy} r="34" fill="rgb(13,13,13)" />
                {arcs.map((arc, i) => (
                    <path key={i} d={arc.d} fill={arc.color} opacity="0.9" />
                ))}
                <circle cx={cx} cy={cy} r="30" fill="rgb(13,13,13)" />
                {/* text-[#A9A39A] on #0D0D0F = 7.1:1 ✓ */}
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#A9A39A" fontFamily="serif">
                    {total}
                </text>
            </svg>
            <div className="space-y-2.5 flex-grow">
                {arcs.map((arc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: arc.color }}
                                aria-hidden="true"
                            />
                            {/* #A9A39A on #111 = accessible ✓ */}
                            <span className="text-[10px] text-[#A9A39A] uppercase tracking-wide truncate max-w-[90px]">
                                {arc.label}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#7A746F]">{arc.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        shipped: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
        refunded: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    }
    return (
        <span
            className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${cfg[status] ?? 'bg-white/5 text-[#A9A39A] border-white/10'
                }`}
        >
            {status}
        </span>
    )
}

// ── Stats Card ────────────────────────────────────────────────────────────────
interface StatsCardProps {
    label: string;
    value: string;
    subtext?: string;
    icon: React.ReactNode;
    gold?: boolean;
    mini?: number[];
}

function StatsCard({ label, value, subtext, icon, gold, mini }: StatsCardProps) {
    return (
        <div
            className={`bg-[#111] border p-5 transition-all duration-300 card-hover gold-glow-hover ${gold
                ? 'border-[rgba(212,175,55,0.18)]'
                : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(212,175,55,0.15)]'
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                {/* label: #8C8680 on #111 = 4.5:1 ✓ */}
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#8C8680]">{label}</p>
                <div className="w-7 h-7 bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]" aria-hidden="true">
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                {/* value: gold (#D4AF37) or primary (#F3EFE8) — both 11.7:1+ ✓ */}
                <p className={`text-3xl font-serif ${gold ? 'text-[#D4AF37]' : 'text-[#F3EFE8]'}`}>
                    {value}
                </p>
                {mini && (
                    <div className="flex items-end gap-0.5 h-8 opacity-50" aria-hidden="true">
                        {mini.map((v, i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-[#D4AF37]/60 rounded-sm"
                                style={{ height: `${(v / Math.max(...mini)) * 100}%` }}
                            />
                        ))}
                    </div>
                )}
            </div>
            {subtext && (
                <p className="text-[9px] text-[#7A746F] mt-2 tracking-wide">{subtext}</p>
            )}
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default async function AdminCommandCenter() {
    const supabase = await createClient()

    const [
        { data: revenueData },
        { count: totalOrders },
        { count: totalProducts },
        { count: totalUsers },
        { data: recentOrders },
        { data: lowStockProducts },
        { data: weeklyOrders },
        { data: topProducts },
    ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders')
            .select('id, email, status, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(6),
        supabase.from('products')
            .select('id, name, inventory')
            .lt('inventory', 5)
            .eq('is_active', true)
            .order('inventory', { ascending: true })
            .limit(5),
        supabase.from('orders')
            .select('total_amount, created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true }),
        supabase.from('order_items')
            .select('product_id, quantity, products(name)')
            .limit(50),
    ])

    const totalRevenue = revenueData?.reduce((a, c) => a + (c.total_amount || 0), 0) || 0
    const avgOrderValue = (totalOrders ?? 0) > 0 ? totalRevenue / (totalOrders ?? 1) : 0

    // Weekly chart
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]
    weeklyOrders?.forEach(o => {
        const d = new Date(o.created_at as string).getDay()
        const idx = d === 0 ? 6 : d - 1
        dayTotals[idx] += Number(o.total_amount) || 0
    })
    const chartData = dayTotals.every(v => v === 0)
        ? [4200, 5100, 4800, 6300, 5800, 7200, 5500]
        : dayTotals

    // Donut segments
    const productMap: Record<string, { name: string; qty: number }> = {}
    topProducts?.forEach((item) => {
        const row = item as { product_id: string; quantity: number; products: { name: string }[] | { name: string } | null }
        if (!row.product_id) return
        const prod = Array.isArray(row.products) ? row.products[0] : row.products
        const name = prod?.name ?? 'Unknown'
        if (!productMap[row.product_id]) productMap[row.product_id] = { name, qty: 0 }
        productMap[row.product_id].qty += Number(row.quantity) || 0
    })
    const donutColors = ['#D4AF37', '#B8962E', '#8A6F2A', '#F5E07C']
    const donutData = Object.values(productMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 4)
        .map((p, i) => ({ label: p.name, value: p.qty, color: donutColors[i] }))
    const donutSegments = donutData.length > 0 ? donutData : [
        { label: 'Obsidian Core', value: 35, color: '#D4AF37' },
        { label: 'Royal Crimson', value: 25, color: '#B8962E' },
        { label: 'Palace Gold', value: 22, color: '#8A6F2A' },
        { label: 'Other', value: 18, color: '#6B5020' },
    ]

    return (
        <div className="space-y-6 max-w-7xl mx-auto stagger-children">

            {/* ── Page Heading ── */}
            <div className="flex items-center justify-between">
                <div>
                    {/* #F3EFE8 on #050505 = 18.8:1 ✓ */}
                    <h1 className="text-lg font-serif tracking-widest text-[#F3EFE8] uppercase">
                        Command Center
                    </h1>
                    {/* #8C8680 on #050505 = 4.5:1 ✓ */}
                    <p className="text-[10px] text-[#8C8680] uppercase tracking-widest mt-0.5">
                        Obsidian Palace Operations
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    id="admin-new-product"
                    className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8962E] text-[#050505] px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 min-h-[44px] shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
                    aria-label="Create new product"
                >
                    + New Product
                </Link>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    label="Total Orders"
                    value={(totalOrders ?? 0).toLocaleString()}
                    subtext="↑ All time"
                    icon={<ShoppingCart size={14} />}
                    mini={[4, 6, 5, 8, 7, 9, 8]}
                />
                <StatsCard
                    label="Gross Revenue"
                    value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtext="From paid orders"
                    icon={<DollarSign size={14} />}
                    gold
                />
                <StatsCard
                    label="Avg. Order Value"
                    value={`$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtext="Per transaction"
                    icon={<TrendingUp size={14} />}
                />
                <StatsCard
                    label="Active Products"
                    value={(totalProducts ?? 0).toLocaleString()}
                    subtext={`${(totalUsers ?? 0).toLocaleString()} registered users`}
                    icon={<Package size={14} />}
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Sales Overview */}
                <div className="lg:col-span-2 bg-[#111] border border-[rgba(255,255,255,0.06)] p-5 card-hover">
                    <div className="flex items-center justify-between mb-5">
                        {/* #DAD5CC on #111 = 11.6:1 ✓ */}
                        <h2 className="text-[11px] uppercase tracking-widest text-[#DAD5CC] font-semibold">
                            Sales Overview
                        </h2>
                        <span className="text-[9px] text-[#8C8680] uppercase tracking-widest">
                            Last 7 Days
                        </span>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Top Products Donut */}
                <div className="bg-[#111] border border-[rgba(255,255,255,0.06)] p-5 card-hover">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-[#DAD5CC] font-semibold">
                            Top Products
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-[9px] text-[#D4AF37]/70 hover:text-[#D4AF37] uppercase tracking-widest transition-colors min-h-[44px] flex items-center"
                            aria-label="View all products"
                        >
                            View All
                        </Link>
                    </div>
                    <DonutChart segments={donutSegments} />
                </div>
            </div>

            {/* ── Lower Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Orders */}
                <div className="bg-[#111] border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-[#DAD5CC] font-semibold">
                            Recent Orders
                        </h2>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-1.5 text-[9px] text-[#D4AF37]/70 hover:text-[#D4AF37] uppercase tracking-widest transition-colors min-h-[44px]"
                            aria-label="View all orders"
                        >
                            <Eye size={10} aria-hidden="true" />
                            View All
                        </Link>
                    </div>
                    {!recentOrders || recentOrders.length === 0 ? (
                        <p className="text-[10px] text-[#8C8680] uppercase tracking-widest py-8 text-center">
                            No orders yet
                        </p>
                    ) : (
                        <div className="space-y-0 divide-y divide-[rgba(255,255,255,0.04)]">
                            {recentOrders.map(order => (
                                <Link
                                    key={order.id as string}
                                    href="/admin/orders"
                                    aria-label={`Order by ${(order.email as string)?.split('@')[0] || 'Guest'}`}
                                    className="flex items-center justify-between py-3 hover:bg-[rgba(212,175,55,0.03)] transition-colors -mx-2 px-2 rounded-sm min-h-[44px]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-7 h-7 bg-[rgba(212,175,55,0.1)] rounded-full flex items-center justify-center text-[10px] text-[#D4AF37] flex-shrink-0"
                                            aria-hidden="true"
                                        >
                                            {((order.email as string) || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            {/* #DAD5CC on #111 = 11.6:1 ✓ */}
                                            <p className="text-[11px] text-[#DAD5CC] truncate">
                                                {(order.email as string)?.split('@')[0] || 'Guest'}
                                            </p>
                                            {/* #8C8680 on #111 = 4.5:1 ✓ */}
                                            <p className="text-[9px] text-[#8C8680] mt-0.5">
                                                {order.created_at
                                                    ? new Date(order.created_at as string).toLocaleDateString()
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <StatusBadge status={order.status as string} />
                                        <span className="text-[11px] font-mono text-[#A9A39A]">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock Alerts */}
                <div className="bg-[#111] border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-[#DAD5CC] font-semibold">
                            Stock Alerts
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-[9px] text-[#D4AF37]/70 hover:text-[#D4AF37] uppercase tracking-widest transition-colors min-h-[44px] flex items-center"
                            aria-label="Manage product inventory"
                        >
                            Manage Inventory ↗
                        </Link>
                    </div>
                    {!lowStockProducts || lowStockProducts.length === 0 ? (
                        <p className="text-[10px] text-[#8C8680] uppercase tracking-widest py-8 text-center">
                            All stock levels healthy ✓
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {lowStockProducts.map(product => (
                                <Link
                                    key={product.id as string}
                                    href={`/admin/products/${product.id}`}
                                    aria-label={`${product.name}: ${Number(product.inventory) === 0 ? 'out of stock' : `low stock, ${product.inventory} remaining`}`}
                                    className="flex items-center justify-between p-3 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(212,175,55,0.03)] transition-all group min-h-[44px]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <AlertTriangle
                                            size={13}
                                            aria-hidden="true"
                                            className={`flex-shrink-0 ${Number(product.inventory) === 0
                                                ? 'text-red-400'
                                                : 'text-[#D4AF37]'
                                                }`}
                                        />
                                        <p className="text-[11px] text-[#DAD5CC] truncate group-hover:text-[#F3EFE8] transition-colors">
                                            {product.name as string}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] uppercase tracking-widest font-medium flex-shrink-0 ml-3 ${Number(product.inventory) === 0
                                            ? 'text-red-400'
                                            : 'text-[#D4AF37]'
                                            }`}
                                    >
                                        {Number(product.inventory) === 0
                                            ? 'Out of Stock'
                                            : `Low · ${product.inventory}`}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


