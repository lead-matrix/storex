"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus, generateShippingLabel } from "./actions";
import { Package, Truck, ExternalLink, Box, MapPin, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";

type Order = {
    id: string;
    created_at: string;
    status: string;
    fulfillment_status: string;
    customer_email: string | null;
    amount_total: number | null;
    total_amount: number | null;
    shipping_label_url: string | null;
    stripe_session_id: string | null;
};

const STATUS_BADGES: Record<string, string> = {
    paid: "bg-emerald-950/40 text-emerald-400 border-emerald-800/50",
    pending: "bg-amber-950/40 text-amber-400 border-amber-800/50",
    processing: "bg-blue-950/40 text-blue-400 border-blue-800/50",
    shipped: "bg-purple-950/40 text-purple-400 border-purple-800/50",
    delivered: "bg-gold/10 text-gold border-gold/30",
    cancelled: "bg-red-950/40 text-red-400 border-red-800/50",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const supabase = createClient();

    async function fetchOrders() {
        setRefreshing(true);
        let query = supabase
            .from("orders")
            .select("id, created_at, status, fulfillment_status, customer_email, amount_total, total_amount, shipping_label_url, stripe_session_id")
            .order("created_at", { ascending: false })
            .limit(200);

        if (filter !== "all") {
            query = query.eq("status", filter);
        }

        const { data } = await query;
        setOrders((data ?? []) as Order[]);
        setLoading(false);
        setRefreshing(false);
    }

    useEffect(() => { fetchOrders(); }, [filter]);

    async function handleStatusUpdate(id: string, status: string) {
        try {
            await updateOrderStatus(id, status);
            setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
            toast.success(`Order marked as ${status}`);
        } catch {
            toast.error("Failed to update status");
        }
    }

    async function handleGenerateLabel(orderId: string) {
        toast.promise(generateShippingLabel(orderId), {
            loading: "Generating shipping label...",
            success: (url) => {
                window.open(url as string, "_blank");
                return "Shipping label generated";
            },
            error: "Fulfillment failed — check Shippo key",
        });
    }

    const revenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + Number(o.amount_total || o.total_amount || 0), 0);
    const paid = orders.filter(o => o.status === "paid").length;
    const pending = orders.filter(o => o.status === "pending").length;
    const shipped = orders.filter(o => o.status === "shipped" || o.fulfillment_status === "fulfilled").length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-8 h-8 border-2 border-white/10 border-t-gold rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-luxury text-white/30 animate-pulse">Loading Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Orders</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Fulfillment & Revenue Intelligence</p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded text-[10px] uppercase tracking-luxury text-white/50 hover:text-gold hover:border-gold/30 transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Gross Revenue", value: `$${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-gold" },
                    { label: "Paid Orders", value: paid, color: "text-emerald-400" },
                    { label: "Pending", value: pending, color: "text-amber-400" },
                    { label: "Shipped", value: shipped, color: "text-purple-400" },
                ].map((s) => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-6 hover:border-gold/30 transition-all">
                        <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30 mb-3">{s.label}</p>
                        <p className={`text-3xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 flex-wrap">
                {["all", "paid", "pending", "processing", "shipped", "delivered", "cancelled"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-[9px] uppercase tracking-luxury font-bold rounded border transition-all ${filter === f
                                ? "bg-gold text-black border-gold"
                                : "bg-transparent text-white/40 border-white/10 hover:border-gold/30 hover:text-white"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-luxury text-gold font-bold">
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Fulfillment</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-white/60 font-medium divide-y divide-white/5">
                            {orders.map((o) => (
                                <tr key={o.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black/40 border border-white/10 rounded flex items-center justify-center text-gold group-hover:border-gold/30 transition-colors shrink-0">
                                                <Box className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-white font-semibold text-[11px] group-hover:text-gold transition-colors">
                                                    #{o.id.slice(0, 8).toUpperCase()}
                                                </p>
                                                <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-luxury">
                                                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-center">
                                        <select
                                            value={o.status}
                                            onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                                            className={`text-[9px] font-bold uppercase tracking-luxury rounded border px-3 py-1.5 outline-none cursor-pointer bg-transparent transition-all ${STATUS_BADGES[o.status] ?? "bg-white/5 text-white/40 border-white/10"
                                                }`}
                                        >
                                            <option value="pending" className="bg-obsidian text-white">Pending</option>
                                            <option value="processing" className="bg-obsidian text-white">Processing</option>
                                            <option value="paid" className="bg-obsidian text-white">Paid</option>
                                            <option value="shipped" className="bg-obsidian text-white">Shipped</option>
                                            <option value="delivered" className="bg-obsidian text-white">Delivered</option>
                                            <option value="cancelled" className="bg-obsidian text-white">Cancelled</option>
                                        </select>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                            <p className="text-white/70 text-[11px] truncate max-w-[180px]">
                                                {o.customer_email || "Guest / No email"}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-right">
                                        <span className="font-serif text-white text-sm">
                                            ${Number(o.amount_total || o.total_amount || 0).toFixed(2)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-right">
                                        {!o.shipping_label_url ? (
                                            <button
                                                onClick={() => handleGenerateLabel(o.id)}
                                                className="bg-gold text-black px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-luxury flex items-center gap-1.5 hover:bg-gold-light transition-colors ml-auto"
                                            >
                                                <Truck className="w-3.5 h-3.5" />
                                                Fulfill
                                            </button>
                                        ) : (
                                            <a
                                                href={o.shipping_label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="border border-gold/25 text-gold px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-luxury flex items-center gap-1.5 hover:bg-gold/10 transition-colors ml-auto"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Label
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center text-white/20 uppercase text-[10px] tracking-luxury italic">
                                        No orders found in the vault.
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
