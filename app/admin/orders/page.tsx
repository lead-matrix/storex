"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Package, Truck, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { fulfillOrder } from "@/lib/actions/admin";
import { toast } from "sonner";

interface Order {
    id: string;
    status: string;
    created_at: string;
    total_amount: number;
    profiles: {
        email: string;
    } | null;
    shipping_address: any;
    metadata: any;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, profiles(email)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching orders:", error);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleFulfill = async (orderId: string) => {
        setActionLoading(orderId);
        try {
            await fulfillOrder(orderId);
            toast.success("Manifestation Dispatched", {
                description: "The artifacts are now en route to the client.",
                style: { background: '#000', color: '#D4AF37', border: '1px solid #D4AF37' }
            });
            await fetchOrders(); // Refresh status
        } catch (error) {
            toast.error("Logistics Failure", {
                description: "The ritual was interrupted. Please check the logs."
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Accessing Acquisition Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-serif text-gold mb-1">Acquisitions & Fulfillment</h2>
                <p className="text-zinc-500 text-sm tracking-widest uppercase">Process luxury logistics</p>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-zinc-950 border border-gold/10 p-6 flex flex-col md:flex-row gap-8 group hover:border-gold/30 transition-all">
                        {/* Status & ID */}
                        <div className="w-full md:w-48 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${order.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    order.status === 'shipped' ? 'bg-blue-500' : 'bg-zinc-700'
                                    }`} />
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{order.status}</span>
                            </div>
                            <p className="text-xs font-mono text-zinc-600">ID: {order.id.slice(0, 13)}...</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Client & Amount */}
                        <div className="flex-grow space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Customer</p>
                            <h3 className="text-white font-sans text-sm">{order.profiles?.email || 'Guest Client'}</h3>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="bg-gold/5 border border-gold/10 px-3 py-1">
                                    <p className="text-[8px] uppercase tracking-widest text-gold/60">Total Value</p>
                                    <p className="text-sm font-serif text-gold">${order.total_amount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Address (Truncated) */}
                        <div className="flex-grow space-y-1 max-w-[200px]">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Destination</p>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                                {order.shipping_address?.address?.city}, {order.shipping_address?.address?.country}
                            </p>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-3">
                            {order.status === 'paid' && (
                                <button
                                    onClick={() => handleFulfill(order.id)}
                                    disabled={actionLoading === order.id}
                                    className="flex items-center gap-2 bg-gold text-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {actionLoading === order.id ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                    Fulfill Order
                                </button>
                            )}
                            {order.status === 'shipped' && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] uppercase tracking-widest text-emerald-500 flex items-center gap-1 font-bold">
                                        <CheckCircle2 size={12} />
                                        Dispatched
                                    </span>
                                    {order.metadata?.shipping_label_url && (
                                        <a
                                            href={order.metadata.shipping_label_url}
                                            target="_blank"
                                            className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            <ExternalLink size={12} />
                                            View Label
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {!orders.length && (
                    <div className="py-20 text-center border border-dashed border-gold/20">
                        <Truck size={40} className="mx-auto text-zinc-800 mb-4" />
                        <p className="text-zinc-500 uppercase tracking-widest text-[10px]">No pending logistics found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
