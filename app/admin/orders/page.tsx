"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus, generateShippingLabel } from "./actions";
import {
    Package,
    Truck,
    ExternalLink,
    CheckCircle2,
    ShoppingBag,
    DollarSign,
    Box,
    MapPin
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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-2 border-white/10 border-t-gold rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] uppercase tracking-widest text-gold animate-pulse">Scanning Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Consignments</h1>
                    <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">Global Logistics Ledger · Obsidian Palace</p>
                </div>
            </div>

            <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                                <th className="px-8 py-5">Reference</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5">Recipient</th>
                                <th className="px-8 py-5 text-center">Valuation</th>
                                <th className="px-8 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-white/60 font-medium">
                            {orders.map((o) => (
                                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black/40 border border-white/10 rounded-md flex items-center justify-center text-gold group-hover:border-gold/30 transition-colors">
                                                <Box className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-mono text-white group-hover:text-gold transition-colors font-medium">
                                                    #{o.id.slice(0, 8).toUpperCase()}
                                                </div>
                                                <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">
                                                    Recorded: {new Date(o.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-3 py-1 rounded text-[9px] uppercase tracking-widest font-bold border ${o.status === 'paid' ? 'border-emerald-900/50 text-emerald-500 bg-emerald-950/20' :
                                                o.status === 'shipped' ? 'border-blue-900/50 text-blue-500 bg-blue-950/20' :
                                                    'border-white/10 text-white/40 bg-white/5'
                                            }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-3 h-3 text-white/20" />
                                            <div className="space-y-0.5">
                                                <p className="text-white/80 font-medium text-xs lowercase">{o.customer_email}</p>
                                                <p className="text-[9px] text-white/20 uppercase tracking-widest">Verified Identity</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-1 text-white font-serif text-sm">
                                            <DollarSign className="w-3 h-3 text-gold" />
                                            {Number(o.amount_total).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            {o.status === 'paid' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(o.id, "shipped")}
                                                    className="bg-emerald-500 text-black px-4 py-1.5 hover:bg-emerald-400 transition-all flex items-center gap-2 group/btn rounded font-bold"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest">Manifest</span>
                                                </button>
                                            )}

                                            {!o.shipping_label_url ? (
                                                <button
                                                    onClick={() => handleGenerateLabel(o.id)}
                                                    className="bg-gold text-black px-4 py-1.5 font-bold flex items-center gap-2 hover:bg-gold-light transition-all active:scale-95 shadow-gold rounded"
                                                >
                                                    <Truck className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest">Fulfill</span>
                                                </button>
                                            ) : (
                                                <a
                                                    href={o.shipping_label_url}
                                                    target="_blank"
                                                    className="bg-white/5 border border-white/10 text-white/60 px-4 py-1.5 flex items-center gap-2 hover:text-white hover:border-gold/50 transition-all rounded shadow-sm"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-widest font-bold">View Label</span>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <ShoppingBag className="w-12 h-12 text-gold" />
                                            <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 italic font-light">The Logistics Ledger is vacant</p>
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
