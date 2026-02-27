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
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((t, i) => (
                    <line key={i}
                        x1={pad} y1={pad + (1 - t) * (h - pad * 2)}
                        x2={w - pad} y2={pad + (1 - t) * (h - pad * 2)}
                        stroke="#E5E7EB" strokeWidth="1"
                    />
                ))}
                {/* Area fill */}
                <path d={area} fill="url(#areaGrad)" />
                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4"
                        fill="#ffffff"
                        stroke="#2563EB"
                        strokeWidth="2"
                    />
                ))}
                {/* Day labels */}
                {points.map((p, i) => (
                    <text key={i} x={p.x} y={h + 18} textAnchor="middle"
                        fontSize="10" fill="#6B7280"
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
                <circle cx={cx} cy={cy} r="34" fill="#ffffff" />
                {arcs.map((arc, i) => (
                    <path key={i} d={arc.d} fill={arc.color} opacity="0.9" />
                ))}
                <circle cx={cx} cy={cy} r="30" fill="#ffffff" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fill="#111827" fontWeight="bold">
                    {total}
                </text>
            </svg>
            <div className="space-y-2.5 flex-grow">
                {arcs.map((arc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: arc.color }}
                                aria-hidden="true"
                            />
                            <span className="text-xs text-gray-700 font-medium truncate max-w-[90px]">
                                {arc.label}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">{arc.pct}%</span>
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
            className="bg-white rounded-xl border border-gray-200 p-6 transition-all duration-300 shadow-sm hover:shadow-md group"
        >
            <div className="flex items-start justify-between mb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-100 transition-colors" aria-hidden="true">
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">
                    {value}
                </p>
                {mini && (
                    <div className="flex items-end gap-1 h-8 opacity-60" aria-hidden="true">
                        {mini.map((v, i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-gray-400 rounded-t-sm"
                                style={{ height: `${(v / Math.max(...mini)) * 100}%` }}
                            />
                        ))}
                    </div>
                )}
            </div>
            {subtext && (
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-3">{subtext}</p>
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
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Dashboard Overview
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Operational metrics and insights
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    id="admin-new-product"
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg shadow-sm"
                    aria-label="Create new product"
                >
                    + Add Product
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
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Sales Timeline
                        </h2>
                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            Last 7 Days
                        </span>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Top Products Donut */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Top Products
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center"
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Recent Orders
                        </h2>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <Eye size={14} />
                            View All
                        </Link>
                    </div>
                    {!recentOrders || recentOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 py-8 text-center">
                            No recent orders
                        </p>
                    ) : (
                        <div className="space-y-0 divide-y divide-gray-50">
                            {recentOrders.map(order => (
                                <Link
                                    key={order.id as string}
                                    href="/admin/orders"
                                    className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors -mx-4 px-4 rounded-lg"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                                            {((order.email as string) || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-900 font-medium truncate">
                                                {(order.email as string)?.split('@')[0] || 'Guest'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {order.created_at ? new Date(order.created_at as string).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <StatusBadge status={order.status as string} />
                                        <span className="text-sm font-bold text-gray-900">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock Alerts */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Low Stock Alerts
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                        >
                            Manage Stock ↗
                        </Link>
                    </div>
                    {!lowStockProducts || lowStockProducts.length === 0 ? (
                        <p className="text-sm text-gray-500 py-8 text-center">
                            All products adequately stocked.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map(product => (
                                <Link
                                    key={product.id as string}
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center justify-between p-4 border border-gray-100 hover:border-gray-200 bg-gray-50 rounded-lg transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <AlertTriangle
                                            size={16}
                                            className={`flex-shrink-0 ${Number(product.inventory) === 0 ? 'text-red-500' : 'text-amber-500'}`}
                                        />
                                        <p className="text-sm text-gray-900 font-medium truncate">
                                            {product.name as string}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${Number(product.inventory) === 0 ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'}`}>
                                        {Number(product.inventory) === 0 ? 'Out of Stock' : `Low (${product.inventory})`}
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


