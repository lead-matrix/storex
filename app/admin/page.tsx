import { createClient } from '@/utils/supabase/server'
import { AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── SVG Sparkline Chart ──────────────────────────────────────────────────────
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
    const area = `M${points[0].x},${h - pad} ` +
        points.map(p => `L${p.x},${p.y}`).join(' ') +
        ` L${points[points.length - 1].x},${h - pad} Z`

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full h-auto" preserveAspectRatio="none">
                {/* Gradient fill */}
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(251,191,36)" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="rgb(251,191,36)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((t, i) => (
                    <line key={i}
                        x1={pad} y1={pad + (1 - t) * (h - pad * 2)}
                        x2={w - pad} y2={pad + (1 - t) * (h - pad * 2)}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                    />
                ))}
                {/* Area fill */}
                <path d={area} fill="url(#areaGrad)" />
                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke="rgb(251,191,36)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5"
                        fill="rgb(251,191,36)"
                        stroke="rgb(13,13,13)"
                        strokeWidth="2"
                    />
                ))}
                {/* Day labels */}
                {points.map((p, i) => (
                    <text key={i} x={p.x} y={h + 18} textAnchor="middle"
                        fontSize="9" fill="rgba(255,255,255,0.25)"
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

// ── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1
    const r = 50
    const cx = 70
    const cy = 70
    let cumAngle = -Math.PI / 2

    const arcs = segments.map(seg => {
        const angle = (seg.value / total) * Math.PI * 2
        const x1 = cx + r * Math.cos(cumAngle)
        const y1 = cy + r * Math.sin(cumAngle)
        cumAngle += angle
        const x2 = cx + r * Math.cos(cumAngle)
        const y2 = cy + r * Math.sin(cumAngle)
        const large = angle > Math.PI ? 1 : 0
        return { ...seg, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`, pct: Math.round((seg.value / total) * 100) }
    })

    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 140 140" className="w-28 h-28 flex-shrink-0">
                {/* Inner ring */}
                <circle cx={cx} cy={cy} r="34" fill="rgb(13,13,13)" />
                {arcs.map((arc, i) => (
                    <path key={i} d={arc.d} fill={arc.color} opacity="0.9" />
                ))}
                <circle cx={cx} cy={cy} r="30" fill="rgb(13,13,13)" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)" fontFamily="serif">
                    {total}
                </text>
            </svg>
            <div className="space-y-2 flex-grow">
                {arcs.map((arc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: arc.color }} />
                            <span className="text-[10px] text-white/50 uppercase tracking-wide truncate max-w-[90px]">{arc.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{arc.pct}%</span>
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
        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${cfg[status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
            {status}
        </span>
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
        // Weekly orders for chart (last 7 days)
        supabase.from('orders')
            .select('total_amount, created_at')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true }),
        // Top selling products
        supabase.from('order_items')
            .select('product_id, quantity, products(name)')
            .limit(50),
    ])

    const totalRevenue = revenueData?.reduce((a, c) => a + (c.total_amount || 0), 0) || 0
    const avgOrderValue = (totalOrders ?? 0) > 0 ? totalRevenue / (totalOrders ?? 1) : 0

    // Build weekly chart data (sum per day)
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]
    weeklyOrders?.forEach(o => {
        const d = new Date(o.created_at as string).getDay()
        const idx = d === 0 ? 6 : d - 1 // Mon=0 … Sun=6
        dayTotals[idx] += Number(o.total_amount) || 0
    })
    // fallback demo data if no orders yet
    const chartData = dayTotals.every(v => v === 0)
        ? [4200, 5100, 4800, 6300, 5800, 7200, 5500]
        : dayTotals

    // Top products for donut
    const productMap: Record<string, { name: string; qty: number }> = {}
    topProducts?.forEach((item) => {
        const row = item as { product_id: string; quantity: number; products: { name: string }[] | { name: string } | null }
        if (!row.product_id) return
        const prod = Array.isArray(row.products) ? row.products[0] : row.products
        const name = prod?.name ?? 'Unknown'
        if (!productMap[row.product_id]) productMap[row.product_id] = { name, qty: 0 }
        productMap[row.product_id].qty += Number(row.quantity) || 0
    })
    const donutColors = ['rgb(251,191,36)', 'rgb(180,120,20)', 'rgb(120,80,10)', 'rgb(220,160,30)']
    const donutData = Object.values(productMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 4)
        .map((p, i) => ({ label: p.name, value: p.qty, color: donutColors[i] }))
    // demo fallback
    const donutSegments = donutData.length > 0 ? donutData : [
        { label: 'Obsidian Core', value: 35, color: 'rgb(251,191,36)' },
        { label: 'Royal Crimson', value: 25, color: 'rgb(180,120,20)' },
        { label: 'Palace Gold', value: 22, color: 'rgb(120,80,10)' },
        { label: 'Other', value: 18, color: 'rgb(60,40,5)' },
    ]

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* ── Page heading ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-serif tracking-widest text-white/80 uppercase">Command Center</h1>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mt-0.5">Obsidian Palace Operations</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 bg-amber-500/90 hover:bg-amber-400 text-black px-4 py-2 text-[10px] uppercase tracking-widest font-semibold transition-colors"
                >
                    + New Product
                </Link>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Orders */}
                <div className="bg-[#111] border border-white/5 p-5 hover:border-white/10 transition-colors">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Total Orders</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-serif text-white/85">{(totalOrders ?? 0).toLocaleString()}</p>
                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-0.5 h-8 opacity-40">
                            {[4, 6, 5, 8, 7, 9, 8].map((v, i) => (
                                <div key={i} className="w-1.5 bg-white/60 rounded-sm" style={{ height: `${(v / 9) * 100}%` }} />
                            ))}
                        </div>
                    </div>
                    <p className="text-[9px] text-white/20 mt-2 tracking-wide">↑ All time</p>
                </div>

                {/* Gross Revenue */}
                <div className="bg-[#111] border border-white/5 p-5 hover:border-amber-500/20 transition-colors">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Gross Revenue</p>
                    <p className="text-3xl font-serif text-amber-400">
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-white/20 mt-2 tracking-wide">From paid orders</p>
                </div>

                {/* Avg Order Value */}
                <div className="bg-[#111] border border-white/5 p-5 hover:border-white/10 transition-colors">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Avg. Order Value</p>
                    <p className="text-3xl font-serif text-white/85">
                        ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-white/20 mt-2 tracking-wide">{(totalProducts ?? 0).toLocaleString()} active products</p>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Sales Overview — line chart */}
                <div className="lg:col-span-2 bg-[#111] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Sales Overview</h2>
                        <span className="text-[9px] text-white/20 uppercase tracking-widest">Last 7 Days</span>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Top Products — donut */}
                <div className="bg-[#111] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Top Products</h2>
                        <Link href="/admin/products" className="text-[9px] text-amber-400/50 hover:text-amber-400 uppercase tracking-widest transition-colors">View All</Link>
                    </div>
                    <DonutChart segments={donutSegments} />
                </div>
            </div>

            {/* ── Lower Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Orders */}
                <div className="bg-[#111] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Recent Orders</h2>
                        <Link href="/admin/orders" className="flex items-center gap-1 text-[9px] text-amber-400/50 hover:text-amber-400 uppercase tracking-widest transition-colors">
                            <Eye size={10} /> View All
                        </Link>
                    </div>
                    {!recentOrders || recentOrders.length === 0 ? (
                        <p className="text-[10px] text-white/20 uppercase tracking-widest py-8 text-center">No orders yet</p>
                    ) : (
                        <div className="space-y-0 divide-y divide-white/4">
                            {recentOrders.map(order => (
                                <Link
                                    key={order.id as string}
                                    href={`/admin/orders`}
                                    className="flex items-center justify-between py-3 hover:bg-white/2 transition-colors -mx-2 px-2 rounded-sm"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-white/40 flex-shrink-0">
                                            {((order.email as string) || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-white/65 truncate">{(order.email as string)?.split('@')[0] || 'Guest'}</p>
                                            <p className="text-[9px] text-white/20 mt-0.5">
                                                {order.created_at ? new Date(order.created_at as string).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <StatusBadge status={order.status as string} />
                                        <span className="text-[11px] font-mono text-white/60">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stock Alerts */}
                <div className="bg-[#111] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Stock Alerts</h2>
                        <Link href="/admin/products" className="text-[9px] text-amber-400/50 hover:text-amber-400 uppercase tracking-widest transition-colors">Manage Inventory ↗</Link>
                    </div>
                    {!lowStockProducts || lowStockProducts.length === 0 ? (
                        <p className="text-[10px] text-white/20 uppercase tracking-widest py-8 text-center">All stock levels healthy ✓</p>
                    ) : (
                        <div className="space-y-2">
                            {lowStockProducts.map(product => (
                                <Link
                                    key={product.id as string}
                                    href={`/admin/products/${product.id}`}
                                    className="flex items-center justify-between p-3 border border-white/5 hover:border-amber-500/20 bg-white/2 hover:bg-amber-500/3 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <AlertTriangle size={13} className={`flex-shrink-0 ${Number(product.inventory) === 0 ? 'text-red-400' : 'text-amber-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-white/65 truncate group-hover:text-white/80 transition-colors">{product.name as string}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest font-medium flex-shrink-0 ml-3 ${Number(product.inventory) === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                        {Number(product.inventory) === 0 ? 'Out of Stock' : `Low Stock · ${product.inventory}`}
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
