'use client'

import { useState, useMemo } from 'react'
import { Box, MapPin, Truck, ExternalLink, ChevronDown, ShoppingBag, CheckSquare, Square, Zap, Search, X, User, Phone, Package, RotateCcw } from 'lucide-react'
import { updateOrderStatus } from '@/lib/actions/admin'
import { generateShippingLabel } from '@/app/admin/orders/actions'
import { FulfillmentRitual } from '@/components/admin/FulfillmentRitual'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled', 'refunded']
const FILTER_TABS = ['All', 'Pending', 'Paid', 'Shipped', 'Cancelled', 'Refunded']

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    paid: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    shipped: 'bg-purple-950/40 text-purple-400 border-purple-800/50',
    cancelled: 'bg-red-950/40 text-red-400 border-red-800/50',
    refunded: 'bg-blue-950/40 text-blue-400 border-blue-800/50',
    partial: 'bg-amber-950/40 text-amber-300 border-amber-700/50',
    fulfilled: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
    unfulfilled: 'bg-red-950/40 text-red-300 border-red-700/50',
}

interface OrderListProps {
    initialOrders: any[]
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusUpdate, onFulfill, onRefund }: {
    order: any;
    onClose: () => void;
    onStatusUpdate: (orderId: string, status: string) => void;
    onFulfill: (order: any) => void;
    onRefund: (order: any) => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#0D0D0F] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-[#0D0D0F] z-10">
                    <div>
                        <p className="font-mono text-gold text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                            {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={order.status}
                                onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                                className={`appearance-none text-[9px] font-bold uppercase tracking-luxury rounded-full border px-4 py-1.5 pr-8 outline-none bg-black/40 cursor-pointer transition-all ${STATUS_COLORS[order.status] || 'bg-[#0B0B0D]/5 border-white/10'}`}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt} className="bg-[#0D0D0F] text-white">{opt}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/30 hover:text-white transition-colors rounded-full bg-white/5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <section>
                        <h3 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-3 flex items-center gap-2">
                            <User className="w-3 h-3" /> Customer
                        </h3>
                        <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 space-y-1.5 text-[12px]">
                            <p className="text-white font-medium">{order.customer_name || 'Guest'}</p>
                            <p className="text-white/50">{order.customer_email}</p>
                            {order.customer_phone && (
                                <p className="text-white/50 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" />{order.customer_phone}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                        <section>
                            <h3 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-3 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Shipping Address
                            </h3>
                            <div className="bg-white/5 border border-white/[0.06] rounded-xl p-4 text-[12px] text-white/70 space-y-1">
                                <p className="text-white">{order.shipping_address.name}</p>
                                <p>{order.shipping_address.line1} {order.shipping_address.line2}</p>
                                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                                <p>{order.shipping_address.country}</p>
                            </div>
                        </section>
                    )}

                    {/* Line Items */}
                    {order.order_items && order.order_items.length > 0 && (
                        <section>
                            <h3 className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-3 flex items-center gap-2">
                                <Package className="w-3 h-3" /> Line Items
                            </h3>
                            <div className="bg-white/5 border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/5">
                                {order.order_items.map((item: any) => {
                                    const productName = item.product_name
                                        || item.product_variants?.products?.title
                                        || 'Product';
                                    const variantName = item.variant_name
                                        || item.product_variants?.name
                                        || null;
                                    return (
                                        <div key={item.id} className="flex items-center gap-4 p-4">
                                            <div className="w-10 h-10 bg-black/30 border border-white/10 rounded overflow-hidden flex-shrink-0">
                                                {item.product_variants?.products?.images?.[0] ? (
                                                    <img
                                                        src={item.product_variants.products.images[0]}
                                                        alt={productName}
                                                        className="w-full h-full object-contain object-center"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-white text-[12px] font-medium truncate">{productName}</p>
                                                {variantName && (
                                                    <p className="text-white/40 text-[10px] uppercase tracking-wider">{variantName}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-white text-[12px] font-serif">${Number(item.price).toFixed(2)}</p>
                                                <p className="text-white/40 text-[10px]">× {item.quantity}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Totals + Fulfillment */}
                    <section className="bg-white/5 border border-white/[0.06] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-[12px]">
                            <span className="text-white/50">Order Total</span>
                            <span className="text-white font-serif font-bold">${Number(order.amount_total || 0).toFixed(2)}</span>
                        </div>
                        {order.metadata?.shipping_cost_cents != null && (
                            <div className="flex justify-between text-[12px]">
                                <span className="text-white/50">Shipping</span>
                                <span className="text-white/70">${(order.metadata.shipping_cost_cents / 100).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[12px] pt-2 border-t border-white/5">
                            <span className="text-white/50">Fulfillment Status</span>
                            <span className={`text-[9px] font-bold uppercase tracking-luxury px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.fulfillment_status || 'unfulfilled'] || 'border-white/10 text-white/40'}`}>
                                {order.fulfillment_status || 'Unfulfilled'}
                            </span>
                        </div>
                        {order.tracking_number && (
                            <div className="flex justify-between text-[12px]">
                                <span className="text-white/50">Tracking #</span>
                                <span className="font-mono text-gold text-[11px]">{order.tracking_number}</span>
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {order.shipping_label_url ? (
                            <a
                                href={order.shipping_label_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 border border-gold/25 text-gold py-3 rounded-xl text-[10px] uppercase tracking-luxury font-bold hover:bg-gold/10 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Download Label
                            </a>
                        ) : (
                            <button
                                onClick={() => { onClose(); onFulfill(order); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-gold text-black py-3 rounded-xl text-[10px] uppercase tracking-luxury font-bold hover:bg-yellow-400 transition-colors shadow-lg"
                            >
                                <Truck className="w-3.5 h-3.5" />
                                Generate Shipping Label
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="sm:w-28 flex items-center justify-center py-3 rounded-xl text-[10px] uppercase tracking-luxury font-bold border border-white/10 text-white/40 hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </div>

                    {/* Refund zone — only show for paid/shipped orders */}
                    {(order.status === 'paid' || order.status === 'shipped') && (
                        <div className="border-t border-white/[0.06] pt-4">
                            <button
                                onClick={() => { onClose(); onRefund(order); }}
                                className="w-full flex items-center justify-center gap-2 border border-red-500/20 text-red-400/70 py-3 rounded-xl text-[10px] uppercase tracking-luxury font-bold hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Issue Full Refund via Stripe
                            </button>
                            <p className="text-white/20 text-[10px] text-center mt-2 leading-relaxed">
                                This cannot be undone. The full amount will be returned to the customer's payment method.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrderList({ initialOrders }: OrderListProps) {
    const router = useRouter()
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [detailOrder, setDetailOrder] = useState<any>(null)
    const [isRitualOpen, setIsRitualOpen] = useState(false)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [statusFilter, setStatusFilter] = useState('All')
    const [refundOrder, setRefundOrder] = useState<any>(null)
    const [isRefunding, setIsRefunding] = useState(false)

    const handleRefund = async (order: any) => {
        if (!confirm(`Issue a full refund of $${Number(order.amount_total || 0).toFixed(2)} to ${order.customer_email}? This cannot be undone.`)) return
        setIsRefunding(true)
        try {
            const res = await fetch('/api/admin/stripe-refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, reason: 'requested_by_customer' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Refund failed')
            toast.success(`Refund issued — $${(data.amount / 100).toFixed(2)} will be returned to the customer.`)
            router.refresh()
        } catch (err: any) {
            toast.error(`Refund failed: ${err.message}`)
        } finally {
            setIsRefunding(false)
        }
    }
    const [searchQuery, setSearchQuery] = useState('')

    const filteredOrders = useMemo(() => {
        let orders = initialOrders
        if (statusFilter !== 'All') {
            orders = orders.filter(o => o.status === statusFilter.toLowerCase())
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            orders = orders.filter(o =>
                (o.customer_email || '').toLowerCase().includes(q) ||
                (o.customer_name || '').toLowerCase().includes(q) ||
                o.id.toLowerCase().includes(q)
            )
        }
        return orders
    }, [initialOrders, statusFilter, searchQuery])

    const handleStatusUpdate = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status)
            toast.success('Order status updated')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to update order')
        }
    }

    const openFulfillment = (order: any) => {
        setSelectedOrder(order)
        setIsRitualOpen(true)
    }

    const toggleSelection = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedOrderIds.length === filteredOrders.length) {
            setSelectedOrderIds([])
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o.id))
        }
    }

    const handleBatchFulfill = async () => {
        const ordersToFulfill = filteredOrders.filter(o => selectedOrderIds.includes(o.id) && !o.shipping_label_url)
        if (ordersToFulfill.length === 0) {
            toast.info("No unfulfilled orders selected")
            return
        }
        toast.promise(
            Promise.all(ordersToFulfill.map(o => generateShippingLabel(o.id))),
            {
                loading: `Processing fulfillment for ${ordersToFulfill.length} orders...`,
                success: 'Batch fulfillment complete',
                error: (err) => `Fulfillment failed: ${err.message}`
            }
        )
        setSelectedOrderIds([])
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* ── Search + Filter Bar ── */}
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or order ID…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-[12px] text-white placeholder-white/20 outline-none focus:border-gold/30 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                statusFilter === tab
                                    ? 'bg-gold text-black'
                                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-white/10'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                    {(statusFilter !== 'All' || searchQuery) && (
                        <button
                            onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                            className="flex-shrink-0 ml-auto text-white/20 hover:text-white/60 transition-colors text-[10px] flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />Clear
                        </button>
                    )}
                </div>

                {/* Batch Actions row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => window.location.href = '/api/admin/orders/export'}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-luxury hover:bg-white/10 transition-all"
                    >
                        <Box size={12} className="text-gold/50" />
                        Export CSV
                    </button>
                    <span className="text-[10px] text-white/20">
                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                    </span>

                    {selectedOrderIds.length > 0 && (
                        <div className="ml-auto bg-white/5 border border-gold/20 px-4 py-2 rounded-lg flex items-center gap-4">
                            <span className="text-[10px] uppercase tracking-luxury text-gold font-bold">
                                {selectedOrderIds.length} Selected
                            </span>
                            <button
                                onClick={() => setSelectedOrderIds([])}
                                className="text-[9px] uppercase text-white/40 hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleBatchFulfill}
                                className="flex items-center gap-2 bg-gold text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-luxury hover:bg-yellow-400 transition-all"
                            >
                                <Zap size={12} />
                                Fulfill All
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── No results ── */}
            {filteredOrders.length === 0 && (
                <div className="py-16 text-center text-white/20">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-[12px] uppercase tracking-luxury">No orders match your filters</p>
                </div>
            )}

            {/* ── Mobile Card View ── */}
            <div className="grid grid-cols-1 gap-3 md:hidden px-4 pb-4">
                {filteredOrders.map((order) => (
                    <div
                        key={order.id}
                        className={`bg-white/5 border border-white/[0.06] rounded-xl p-4 space-y-3 transition-all ${selectedOrderIds.includes(order.id) ? 'border-gold/30 bg-gold/5' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleSelection(order.id)}
                                    className={`transition-colors min-h-[36px] min-w-[36px] border border-white/10 rounded flex items-center justify-center ${selectedOrderIds.includes(order.id) ? 'text-gold border-gold/30' : 'text-white/20'}`}
                                >
                                    {selectedOrderIds.includes(order.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                                <div>
                                    <p className="font-mono text-white text-[11px] font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-serif text-white">${Number(order.amount_total || 0).toFixed(2)}</p>
                                <span className={`text-[8px] font-bold uppercase tracking-luxury px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] || 'border-white/10 text-white/40'}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2 border-y border-white/5">
                            <div>
                                <p className="text-white text-[11px]">{order.customer_name || order.customer_email || 'Guest'}</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                    <MapPin size={9} className="text-gold/40" />
                                    {order.shipping_address?.city || 'No address'}
                                </p>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                className={`appearance-none text-[9px] font-bold uppercase tracking-luxury rounded-full border px-3 py-1 outline-none bg-black/40 cursor-pointer ${STATUS_COLORS[order.status] || 'border-white/10'}`}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt} className="bg-[#0D0D0F] text-white">{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setDetailOrder(order)}
                                className="flex-1 py-2 border border-white/10 text-white/50 rounded-lg text-[10px] uppercase tracking-luxury font-bold hover:border-gold/30 hover:text-gold transition-colors"
                            >
                                View Details
                            </button>
                            {order.shipping_label_url ? (
                                <a
                                    href={order.shipping_label_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 border border-gold/25 text-gold py-2 rounded-lg text-[10px] uppercase tracking-luxury font-bold hover:bg-gold/10 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Label
                                </a>
                            ) : (
                                <button
                                    onClick={() => openFulfillment(order)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-black py-2 rounded-lg text-[10px] uppercase tracking-luxury font-bold hover:bg-yellow-400 transition-colors"
                                >
                                    <Truck className="w-3 h-3" />
                                    Fulfill
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Desktop Table View ── */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-luxury text-gold font-bold">
                            <th className="px-6 py-4 w-12">
                                <button onClick={toggleAll} className="p-1 hover:text-white transition-colors">
                                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                                        <CheckSquare className="w-4 h-4" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4">Order</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/[0.04]">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedOrderIds.includes(order.id) ? 'bg-gold/5' : ''}`}>
                                <td className="px-6 py-5">
                                    <button
                                        onClick={() => toggleSelection(order.id)}
                                        className={`transition-colors ${selectedOrderIds.includes(order.id) ? 'text-gold' : 'text-white/20 group-hover:text-white/40'}`}
                                    >
                                        {selectedOrderIds.includes(order.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </button>
                                </td>

                                {/* Order ID + Date */}
                                <td className="px-6 py-5">
                                    <div
                                        className="space-y-1 cursor-pointer"
                                        onClick={() => setDetailOrder(order)}
                                    >
                                        <p className="font-mono text-white font-semibold text-[11px] hover:text-gold transition-colors">
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-luxury">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-[9px] text-white/20">
                                            {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </td>

                                {/* Customer */}
                                <td className="px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-white text-[12px] font-medium">{order.customer_name || 'Guest'}</p>
                                        <p className="text-[10px] text-white/30 truncate max-w-[180px]">{order.customer_email}</p>
                                        <p className="text-[10px] text-white/20 flex items-center gap-1 uppercase tracking-luxury">
                                            <MapPin className="w-3 h-3 text-gold/40" />
                                            {order.shipping_address?.city || 'No address'}
                                        </p>
                                    </div>
                                </td>

                                {/* Total */}
                                <td className="px-6 py-5">
                                    <p className="text-sm font-serif text-white">${Number(order.amount_total || 0).toFixed(2)}</p>
                                    {order.fulfillment_status && (
                                        <span className={`text-[8px] font-bold uppercase tracking-luxury px-2 py-0.5 rounded-full border mt-1 inline-block ${STATUS_COLORS[order.fulfillment_status] || 'border-white/10 text-white/30'}`}>
                                            {order.fulfillment_status}
                                        </span>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="px-6 py-5 text-center">
                                    <div className="relative inline-block">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                            className={`appearance-none text-[9px] font-bold uppercase tracking-luxury rounded-full border px-3 py-1.5 pr-8 outline-none cursor-pointer bg-black/40 transition-all ${STATUS_COLORS[order.status] || 'border-white/10'}`}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt} className="bg-[#0D0D0F] text-white">{opt}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setDetailOrder(order)}
                                            className="h-8 px-3 flex items-center gap-1.5 border border-white/10 text-white/40 rounded-lg text-[9px] uppercase font-bold hover:border-gold/30 hover:text-gold transition-colors"
                                        >
                                            Details
                                        </button>
                                        {order.shipping_label_url ? (
                                            <a
                                                href={order.shipping_label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="h-8 px-3 flex items-center gap-1.5 border border-gold/25 text-gold rounded-lg text-[9px] uppercase font-bold hover:bg-gold/10 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Label
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => openFulfillment(order)}
                                                className="h-8 px-3 flex items-center gap-1.5 bg-gold text-black rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                                            >
                                                <Truck className="w-3 h-3" />
                                                Fulfill
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {detailOrder && (
                <OrderDetailModal
                    order={detailOrder}
                    onClose={() => setDetailOrder(null)}
                    onStatusUpdate={async (id, status) => {
                        await handleStatusUpdate(id, status)
                        setDetailOrder((prev: any) => prev ? { ...prev, status } : null)
                    }}
                    onFulfill={(order) => {
                        setDetailOrder(null)
                        openFulfillment(order)
                    }}
                    onRefund={(order) => {
                        setDetailOrder(null)
                        handleRefund(order)
                    }}
                />
            )}

            {/* Fulfillment Ritual Modal */}
            {selectedOrder && (
                <FulfillmentRitual
                    order={selectedOrder}
                    isOpen={isRitualOpen}
                    onOpenChange={setIsRitualOpen}
                    onSuccess={() => {
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}
