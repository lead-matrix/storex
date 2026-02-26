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
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Consignments</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Global Logistics Ledger</p>
                </div>
            </div>

            <div className="bg-white rounded-luxury shadow-soft border border-charcoal/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-charcoal/5 bg-pearl/30 text-[10px] uppercase tracking-luxury text-textsoft font-bold">
                                <th className="px-8 py-5">Reference</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5">Destination</th>
                                <th className="px-8 py-5 text-center font-heading">Valuation</th>
                                <th className="px-8 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-textsoft font-medium">
                            {orders.map((o) => (
                                <tr key={o.id} className="border-b border-charcoal/5 hover:bg-gold/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-mono text-charcoal group-hover:text-gold transition-colors font-medium">
                                            #{o.id.slice(0, 8)}
                                        </div>
                                        <p className="text-[10px] text-textsoft/70 mt-1 uppercase tracking-luxury">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-luxury font-medium border ${o.status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                o.status === 'shipped' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                    'border-charcoal/10 text-charcoal bg-pearl/50'
                                                }`}>
                                                {o.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1 max-w-[200px]">
                                            <p className="text-charcoal font-medium text-xs truncate lowercase">{o.customer_email}</p>
                                            <p className="text-[9px] text-textsoft/70 truncate uppercase">Verified Identity</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center font-heading text-sm text-charcoal">
                                        ${Number(o.amount_total).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {o.status === 'paid' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(o.id, "shipped")}
                                                    className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 hover:bg-emerald-100 transition-all flex items-center gap-2 group/btn rounded-md shadow-sm"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-luxury font-medium">Manifest</span>
                                                </button>
                                            )}

                                            {!o.shipping_label_url ? (
                                                <button
                                                    onClick={() => handleGenerateLabel(o.id)}
                                                    className="bg-charcoal text-pearl px-4 py-1.5 font-medium flex items-center gap-2 hover:bg-gold hover:text-white transition-all active:scale-95 shadow-soft rounded-md"
                                                >
                                                    <Truck className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-luxury">Fulfill</span>
                                                </button>
                                            ) : (
                                                <a
                                                    href={o.shipping_label_url}
                                                    target="_blank"
                                                    className="bg-pearl border border-charcoal/10 text-textsoft px-4 py-1.5 flex items-center gap-2 hover:text-charcoal hover:border-charcoal/30 transition-all rounded-md shadow-sm"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span className="text-[9px] uppercase tracking-luxury font-medium">View Label</span>
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
                                            <ShoppingBag className="w-8 h-8 text-charcoal/30" />
                                            <p className="text-[10px] uppercase tracking-luxury text-textsoft">No active consignments found</p>
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
