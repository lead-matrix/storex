'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Box, MapPin, Truck, ExternalLink, ChevronDown, ShoppingBag } from 'lucide-react'
import { fulfillOrder, updateOrderStatus } from '@/lib/actions/admin'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled', 'refunded']

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    paid: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    shipped: 'bg-purple-950/40 text-purple-400 border-purple-800/50',
    cancelled: 'bg-red-950/40 text-red-400 border-red-800/50',
    refunded: 'bg-blue-950/40 text-blue-400 border-blue-800/50',
}

interface OrderListProps {
    initialOrders: any[]
}

export default function OrderList({ initialOrders }: OrderListProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleStatusUpdate = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status)
            toast.success('Order status updated')
        } catch (err: any) {
            toast.error(err.message || 'Failed to update order')
        }
    }

    const handleFulfillment = async (orderId: string) => {
        setLoadingMap(prev => ({ ...prev, [orderId]: true }))
        try {
            await fulfillOrder(orderId)
            toast.success('Order fulfilled successfully')
        } catch (err: any) {
            toast.error(err.message || 'Fulfillment failed')
        } finally {
            setLoadingMap(prev => ({ ...prev, [orderId]: false }))
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                        <th className="px-6 py-5">Identities</th>
                        <th className="px-6 py-5">Customers</th>
                        <th className="px-6 py-5">Revenue</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/5">
                    {initialOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
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

                            {/* Revenue & Items Tooltip Link */}
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
                            <td className="px-6 py-6">
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
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-6 text-right">
                                <div className="flex items-center justify-end gap-3">
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
                                            onClick={() => handleFulfillment(order.id)}
                                            disabled={loadingMap[order.id]}
                                            className="h-9 px-4 flex items-center gap-2 bg-gold text-black rounded text-[10px] uppercase tracking-luxury font-bold hover:bg-gold-light transition-colors shadow-gold disabled:opacity-50"
                                        >
                                            <Truck className="w-3.5 h-3.5" />
                                            {loadingMap[order.id] ? 'Drafting...' : 'Fulfill'}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
