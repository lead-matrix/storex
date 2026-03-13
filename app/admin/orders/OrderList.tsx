'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Box, MapPin, Truck, ExternalLink, ChevronDown, ShoppingBag, CheckSquare, Square, Zap } from 'lucide-react'
import { updateOrderStatus } from '@/lib/actions/admin'
import { FulfillmentRitual } from '@/components/admin/FulfillmentRitual'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled', 'refunded']

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    paid: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    shipped: 'bg-purple-950/40 text-purple-400 border-purple-800/50',
    cancelled: 'bg-red-950/40 text-red-400 border-red-800/50',
    refunded: 'bg-blue-950/40 text-blue-400 border-blue-800/50',
    partial: 'bg-gold-950/40 text-gold border-gold/50',
}

interface OrderListProps {
    initialOrders: any[]
}

export default function OrderList({ initialOrders }: OrderListProps) {
    const router = useRouter()
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isRitualOpen, setIsRitualOpen] = useState(false)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

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
        if (selectedOrderIds.length === initialOrders.length) {
            setSelectedOrderIds([])
        } else {
            setSelectedOrderIds(initialOrders.map(o => o.id))
        }
    }

    const handleBatchFulfill = async () => {
        const ordersToFulfill = initialOrders.filter(o => selectedOrderIds.includes(o.id) && !o.shipping_label_url)
        if (ordersToFulfill.length === 0) {
            toast.info("No eligible orders selected for fulfillment")
            return
        }

        toast.promise(
            Promise.all(ordersToFulfill.map(o => {
                const { generateShippingLabel } = require('@/app/admin/orders/actions')
                return generateShippingLabel(o.id)
            })),
            {
                loading: `Processing batch of ${ordersToFulfill.length} fulfillments...`,
                success: 'Batch fulfillment completed',
                error: 'Some fulfillments failed'
            }
        )
        setSelectedOrderIds([])
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* Batch Action Bar */}
            {selectedOrderIds.length > 0 && (
                <div className="bg-white/5 border border-gold/20 p-4 rounded-luxury flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-luxury text-gold font-bold">
                            {selectedOrderIds.length} Selections in Vault
                        </span>
                        <div className="h-4 w-px bg-white/10" />
                        <button
                            onClick={() => setSelectedOrderIds([])}
                            className="text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                            Deselect All
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBatchFulfill}
                            className="flex items-center gap-2 bg-gold text-black px-6 py-2 rounded-luxury text-[10px] font-bold uppercase tracking-luxury hover:bg-gold-light transition-all shadow-gold"
                        >
                            <Zap size={12} />
                            Batch Fulfillment
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto bg-white/5 rounded-luxury border border-white/5 shadow-soft">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                            <th className="px-6 py-5 w-12">
                                <button onClick={toggleAll} className="p-1 hover:text-white transition-colors">
                                    {selectedOrderIds.length === initialOrders.length && initialOrders.length > 0 ? (
                                        <CheckSquare className="w-4 h-4" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-5">Identities</th>
                            <th className="px-6 py-5">Customers</th>
                            <th className="px-6 py-5">Revenue</th>
                            <th className="px-6 py-5 text-center">Status</th>
                            <th className="px-6 py-5 text-right font-serif">Registry Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/5">
                        {initialOrders.map((order) => (
                            <tr key={order.id} className={`hover:bg-white/5 transition-colors group ${selectedOrderIds.includes(order.id) ? 'bg-gold/5' : ''}`}>
                                <td className="px-6 py-6">
                                    <button
                                        onClick={() => toggleSelection(order.id)}
                                        className={`transition-colors ${selectedOrderIds.includes(order.id) ? 'text-gold' : 'text-white/20 group-hover:text-white/40'}`}
                                    >
                                        {selectedOrderIds.includes(order.id) ? (
                                            <CheckSquare className="w-4 h-4" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </td>

                                {/* Order ID & Date */}
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-black/40 border border-white/10 rounded flex items-center justify-center text-gold group-hover:border-gold/30 transition-colors shrink-0 shadow-soft">
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-mono text-white font-semibold text-[11px] group-hover:text-gold transition-colors">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-luxury">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Customer & Address */}
                                <td className="px-6 py-6">
                                    <div className="space-y-1">
                                        <p className="text-white text-sm font-serif">{order.customer_email || 'Guest'}</p>
                                        <p className="text-[10px] text-white/30 flex items-center gap-1.5 uppercase tracking-luxury">
                                            <MapPin className="w-3 h-3 text-gold/50" />
                                            {order.shipping_address?.city || 'No Address'}
                                        </p>
                                    </div>
                                </td>

                                {/* Revenue & Items */}
                                <td className="px-6 py-6">
                                    <div className="space-y-1">
                                        <p className="text-sm font-serif text-white">${Number(order.amount_total || 0).toFixed(2)}</p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-luxury flex items-center gap-1.5">
                                            <ShoppingBag className="w-3 h-3" />
                                            {order.order_items?.length || 0} Assets
                                        </p>
                                    </div>
                                </td>

                                {/* Status Select */}
                                <td className="px-6 py-6 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                        <div className="relative inline-block">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                className={`appearance-none text-[9px] font-bold uppercase tracking-luxury rounded-sm border px-3 py-1.5 pr-8 outline-none cursor-pointer bg-black/40 transition-all ${STATUS_COLORS[order.status] || 'bg-white/5 border-white/10'}`}
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt} className="bg-obsidian text-white">{opt}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                        </div>
                                        {order.fulfillment_status === 'partial' && (
                                            <span className={`text-[7px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${STATUS_COLORS.partial}`}>
                                                Partial Transport
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {order.shipping_label_url ? (
                                            <a
                                                href={order.shipping_label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="h-9 px-4 flex items-center gap-2 border border-gold/25 text-gold rounded text-[10px] uppercase tracking-luxury hover:bg-gold/10 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Portal
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => openFulfillment(order)}
                                                className="h-9 px-4 flex items-center gap-2 bg-gold text-black rounded text-[10px] uppercase tracking-luxury font-bold hover:bg-gold-light transition-colors shadow-gold"
                                            >
                                                <Truck className="w-3.5 h-3.5" />
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
