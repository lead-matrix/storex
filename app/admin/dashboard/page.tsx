"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    BarChart3,
    Package,
    ShoppingBag,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    DollarSign
} from "lucide-react";

export default function AdminDashboard() {
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [totalSales, setTotalSales] = useState<number>(0);
    const [stockAlerts, setStockAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: ordersData } = await supabase.from("orders").select("*");
                const { data: productsData } = await supabase.from("products").select("*");

                setOrders(ordersData ?? []);
                setProducts(productsData ?? []);

                const sales = ordersData?.reduce((acc, o) => acc + parseFloat(o.amount_total || 0), 0) ?? 0;
                setTotalSales(sales);

                const lowStock = productsData?.filter((p) => p.stock < 10) ?? [];
                setStockAlerts(lowStock);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [supabase]);

    const summary = [
        {
            label: "Gross Volume",
            value: `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
            border: "border-emerald-500/10"
        },
        {
            label: "Active Orders",
            value: orders.length,
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-500/5",
            border: "border-blue-500/10"
        },
        {
            label: "Stock At Risk",
            value: stockAlerts.length,
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
            border: "border-amber-500/10"
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-t-2 border-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-white mb-2 italic tracking-tight">Intelligence</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-[0.4em] font-medium">Storefront Operational Oversight</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {summary.map((s) => (
                    <div key={s.label} className={`bg-zinc-950 border ${s.border} p-8 space-y-4`}>
                        <div className="flex items-center justify-between">
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                            <TrendingUp className="w-3 h-3 text-zinc-800" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">{s.label}</p>
                            <p className="text-3xl font-serif text-white mt-1 italic leading-none">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Recent Orders */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <ShoppingBag className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Recent Acquisitions</h2>
                    </div>
                    <div className="space-y-4">
                        {orders.slice(-5).reverse().map((o) => (
                            <div key={o.id} className="bg-zinc-950 border border-white/5 p-6 flex justify-between items-center group hover:border-gold/20 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-zinc-600 uppercase">Ref: {o.id.slice(0, 8)}</p>
                                    <p className="text-white text-sm tracking-wide lowercase">{o.customer_email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-serif italic text-lg">${Number(o.amount_total).toFixed(2)}</p>
                                    <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">{o.status}</span>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-800 py-12 text-center">No recent transactions</p>
                        )}
                    </div>
                </div>

                {/* Stock Alerts */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <Package className="w-4 h-4 text-zinc-500" />
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Stock Depletion Alerts</h2>
                    </div>
                    <div className="space-y-4">
                        {stockAlerts.length === 0 ? (
                            <div className="bg-zinc-950 border border-white/5 p-12 text-center">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500/50">Inventory is sufficiently optimized</p>
                            </div>
                        ) : (
                            stockAlerts.map((p) => (
                                <div key={p.id} className="bg-zinc-950 border border-red-500/10 p-6 flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <p className="text-white text-sm tracking-wide">{p.name}</p>
                                        <p className="text-[9px] text-zinc-600 font-mono">Current Reserves: {p.stock} Units</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/5 border border-red-500/20">
                                        <AlertTriangle className="w-3 h-3 text-red-500" />
                                        <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Low Portions</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
