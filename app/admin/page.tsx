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
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        shipped: 'bg-blue-50 text-blue-700 border-blue-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
        refunded: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    }
    return (
        <span
            className={`text-[9px] uppercase tracking-luxury font-medium px-2 py-0.5 border rounded-full ${cfg[status] ?? 'bg-charcoal/5 text-textsoft border-charcoal/10'
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
            className="bg-[#0f0f0f] rounded-xl border border-white/10 p-6 transition-all duration-300 shadow-2xl hover:border-gold/30 group"
        >
            <div className="flex items-start justify-between mb-6">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#A9A39A]">{label}</p>
                <div className="w-8 h-8 rounded-full bg-black border border-white/5 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors" aria-hidden="true">
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <p className={`text-4xl font-serif ${gold ? 'text-gold' : 'text-white'}`}>
                    {value}
                </p>
                {mini && (
                    <div className="flex items-end gap-1 h-8 opacity-60" aria-hidden="true">
                        {mini.map((v, i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-gold/60 rounded-t-sm"
                                style={{ height: `${(v / Math.max(...mini)) * 100}%` }}
                            />
                        ))}
                    </div>
                )}
            </div>
            {subtext && (
                <p className="text-[9px] uppercase tracking-widest text-[#7A746F] mt-3">{subtext}</p>
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
                    <h1 className="text-2xl font-serif tracking-widest text-white uppercase">
                        Command Center
                    </h1>
                    <p className="text-[10px] text-luxury-subtext uppercase tracking-widest mt-2 font-medium">
                        Obsidian Palace Operations
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    id="admin-new-product"
                    className="flex items-center gap-3 bg-gold hover:bg-[#D4AF37] text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 min-h-[44px] rounded-lg shadow-[0_0_20px_rgba(198,167,94,0.15)] hover:shadow-[0_0_20px_rgba(198,167,94,0.3)]"
                    aria-label="Create new product"
                >
                    + New Artifact
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sales Overview */}
                <div className="lg:col-span-2 bg-[#0f0f0f] rounded-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-gold/30">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[11px] uppercase tracking-widest text-white font-serif">
                            Sales Timeline
                        </h2>
                        <span className="text-[9px] text-gold uppercase tracking-widest bg-gold/5 px-3 py-1 rounded-full border border-gold/20">
                            Last 7 Days
                        </span>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Top Products Donut */}
                <div className="bg-[#0f0f0f] rounded-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-gold/30">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[11px] uppercase tracking-widest text-white font-serif">
                            Top Artifacts
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-[9px] text-[#A9A39A] hover:text-gold uppercase tracking-widest transition-colors flex items-center"
                        >
                            View All
                        </Link>
                    </div>
                    <DonutChart segments={donutSegments} />
                </div>
            </div>

            {/* ── Lower Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Orders */}
                <div className="bg-[#0f0f0f] rounded-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-gold/30">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h2 className="text-[11px] uppercase tracking-widest text-white font-serif">
                            Recent Operations
                        </h2>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-2 text-[9px] text-[#A9A39A] hover:text-gold uppercase tracking-widest transition-colors"
                        >
                            <Eye size={12} />
                            View Flow
                        </Link>
                    </div>
                    {!recentOrders || recentOrders.length === 0 ? (
                        <p className="text-[10px] text-white/30 uppercase tracking-widest py-8 text-center">
                            Awaiting operations
                        </p>
                    ) : (
                        <div className="space-y-0 divide-y divide-white/5">
                            {recentOrders.map(order => (
                                <Link
                                    key={order.id as string}
                                    href="/admin/orders"
                                    className="flex items-center justify-between py-4 hover:bg-white/5 transition-colors -mx-4 px-4 rounded-lg"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-[10px] text-gold font-medium">
                                            {((order.email as string) || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-white font-medium truncate uppercase tracking-widest">
                                                {(order.email as string)?.split('@')[0] || 'Guest'}
                                            </p>
                                            <p className="text-[9px] text-[#A9A39A] mt-1 tracking-widest">
                                                {order.created_at ? new Date(order.created_at as string).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <StatusBadge status={order.status as string} />
                                        <span className="text-[12px] font-serif text-white group-hover:text-gold transition-colors">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock Alerts */}
                <div className="bg-[#0f0f0f] rounded-xl border border-white/10 shadow-2xl p-6 transition-all duration-300 hover:border-gold/30">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h2 className="text-[11px] uppercase tracking-widest text-white font-serif">
                            Inventory Threshold
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-[9px] text-[#A9A39A] hover:text-gold uppercase tracking-widest transition-colors flex items-center"
                        >
                            Manage Stock ↗
                        </Link>
                    </div>
                    {!lowStockProducts || lowStockProducts.length === 0 ? (
                        <p className="text-[10px] text-white/30 uppercase tracking-widest py-8 text-center font-serif italic">
                            All artifacts adequately stocked.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map(product => (
                                <Link
                                    key={product.id as string}
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center justify-between p-4 border border-white/5 hover:border-white/20 bg-black rounded-lg transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <AlertTriangle
                                            size={14}
                                            className={`flex-shrink-0 ${Number(product.inventory) === 0 ? 'text-red-500' : 'text-gold'}`}
                                        />
                                        <p className="text-[11px] text-white font-medium truncate uppercase tracking-widest group-hover:text-gold transition-colors">
                                            {product.name as string}
                                        </p>
                                    </div>
                                    <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border ${Number(product.inventory) === 0 ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-gold border-gold/20 bg-gold/5'}`}>
                                        {Number(product.inventory) === 0 ? 'Depleted' : `Low (${product.inventory})`}
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


