"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus, generateShippingLabel } from "./actions";
import {
    Package,
    Truck,
    ExternalLink,
    Search,
    ShoppingBag,
    CheckCircle2,
    Clock,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrders() {
            const { data } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });
            setOrders(data ?? []);
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    async function handleStatusUpdate(id: string, status: string) {
        try {
            await updateOrderStatus(id, status);
            setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
            toast.success(`Order marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    async function handleGenerateLabel(orderId: string) {
        const promise = generateShippingLabel(orderId);

        toast.promise(promise, {
            loading: 'Generating shipping label...',
            success: (url) => {
                window.open(url as string, '_blank');
                return 'Label generated successfully';
            },
            error: 'Logistics fulfillment failed'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-t-2 border-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-white mb-2 italic tracking-tight">Consignments</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-[0.4em] font-medium">Global Logistics Ledger</p>
                </div>
            </div>

            <div className="bg-zinc-950 border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                                <th className="px-8 py-5">Reference</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5">Destination</th>
                                <th className="px-8 py-5 text-center font-serif">Valuation</th>
                                <th className="px-8 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-zinc-400 font-light">
                            {orders.map((o) => (
                                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-mono text-zinc-600 group-hover:text-gold transition-colors italic">
                                            #{o.id.slice(0, 8)}
                                        </div>
                                        <p className="text-[10px] text-zinc-800 mt-1 uppercase tracking-tighter">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-bold border ${o.status === 'paid' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                                                    o.status === 'shipped' ? 'border-blue-500/20 text-blue-400 bg-blue-500/5' :
                                                        'border-zinc-800 text-zinc-600'
                                                }`}>
                                                {o.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1 max-w-[200px]">
                                            <p className="text-white text-xs truncate lowercase">{o.customer_email}</p>
                                            <p className="text-[9px] text-zinc-600 truncate uppercase">Verified Identity</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center font-serif italic text-sm text-zinc-200">
                                        ${Number(o.amount_total).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {o.status === 'paid' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(o.id, "shipped")}
                                                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 hover:bg-emerald-500/20 transition-all flex items-center gap-2 group/btn"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest font-bold">Manifest</span>
                                                </button>
                                            )}

                                            {!o.shipping_label_url ? (
                                                <button
                                                    onClick={() => handleGenerateLabel(o.id)}
                                                    className="bg-gold text-black px-4 py-1.5 font-bold flex items-center gap-2 hover:bg-gold/90 transition-all active:scale-95 shadow-[0_4px_20px_rgba(212,175,55,0.1)]"
                                                >
                                                    <Truck className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest">Fulfill</span>
                                                </button>
                                            ) : (
                                                <a
                                                    href={o.shipping_label_url}
                                                    target="_blank"
                                                    className="bg-zinc-900 border border-white/10 text-zinc-400 px-4 py-1.5 flex items-center gap-2 hover:text-white hover:border-white/30 transition-all"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest">View Label</span>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <ShoppingBag className="w-8 h-8 text-zinc-900" />
                                            <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-800">No active consignments found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
