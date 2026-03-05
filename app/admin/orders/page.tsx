import { createClient } from "@/utils/supabase/server";
import { Package, Truck, ExternalLink, Box, MapPin, RefreshCw, Filter, ShoppingBag, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import OrderList from "./OrderList";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders | Admin" };

export default async function AdminOrdersPage() {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                id,
                quantity,
                price,
                products (
                    name,
                    images
                )
            )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Orders Fetch Error:", error);
    }

    const revenue = orders?.filter(o => o.status === "paid" || o.status === "shipped").reduce((s, o) => s + Number(o.amount_total || 0), 0) || 0;
    const paidCount = orders?.filter(o => o.status === "paid").length || 0;
    const pendingCount = orders?.filter(o => o.status === "pending").length || 0;
    const shippedCount = orders?.filter(o => o.status === "shipped").length || 0;

    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Registry</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Transaction & Fulfillment Intelligence</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Net Revenue", value: `$${revenue.toLocaleString()}`, color: "text-gold", icon: ShoppingBag },
                    { label: "Pending", value: pendingCount, color: "text-amber-400", icon: Clock },
                    { label: "Paid", value: paidCount, color: "text-emerald-400", icon: CheckCircle },
                    { label: "Fulfilled", value: shippedCount, color: "text-purple-400", icon: Truck },
                ].map((s) => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-6 hover:border-gold/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30">{s.label}</p>
                            <s.icon className={`w-4 h-4 ${s.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className={`text-4xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Orders Table Wrapper (Client Interactive Component) */}
            <div className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border overflow-hidden">
                <OrderList initialOrders={orders || []} />
            </div>
        </div>
    );
}
