"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
    TrendingUp,
    Users,
    ShoppingBag,
    AlertCircle,
    Loader2
} from "lucide-react";

interface RecentOrder {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    profiles: {
        email: string;
    } | null;
}

interface DashboardStats {
    productsCount: number;
    ordersCount: number;
    totalRevenue: number;
    recentOrders: RecentOrder[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);

            try {
                // Fetch Stats in parallel
                const [
                    { count: pCount },
                    { count: oCount },
                    { data: revenueData },
                    { data: oData }
                ] = await Promise.all([
                    supabase.from('products').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('total_amount').eq('status', 'paid'),
                    supabase.from('orders')
                        .select('id, total_amount, status, created_at, profiles(email)')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ]);

                const revenue = (revenueData as any[])?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

                setStats({
                    productsCount: pCount || 0,
                    ordersCount: oCount || 0,
                    totalRevenue: revenue,
                    recentOrders: (oData as any[]) || []
                });
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Loading Palace Metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-serif text-gold mb-1">Architectural Overview</h2>
                <p className="text-zinc-500 text-sm tracking-widest uppercase">Performance metrics for your luxury empire</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={`$${stats?.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="text-emerald-500" />}
                    sub="Gross Manifestations"
                />
                <StatCard
                    label="Active Orders"
                    value={stats?.ordersCount.toString() || "0"}
                    icon={<ShoppingBag className="text-gold" />}
                    sub="Current Acquisitions"
                />
                <StatCard
                    label="Palace Residents"
                    value={"1.2k"}
                    icon={<Users className="text-blue-500" />}
                    sub="Loyal Clientele"
                />
                <StatCard
                    label="Live Artifacts"
                    value={stats?.productsCount.toString() || "0"}
                    icon={<AlertCircle className="text-gold/50" />}
                    sub="Active Inventory"
                />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-zinc-950 border border-gold/10 p-6">
                <h3 className="text-xl font-serif text-white mb-6">Recent Acquisitions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gold/10 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                <th className="pb-4 font-medium">Order ID</th>
                                <th className="pb-4 font-medium">Client</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium">Amount</th>
                                <th className="pb-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                            {stats?.recentOrders.map((order) => (
                                <tr key={order.id} className="text-sm">
                                    <td className="py-4 font-mono text-zinc-400">#{order.id.slice(0, 8)}</td>
                                    <td className="py-4">{order.profiles?.email || 'Guest'}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${order.status === 'paid' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' :
                                            'border-gold/50 text-gold bg-gold/5'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-4 font-serif">${order.total_amount}</td>
                                    <td className="py-4 text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {!stats?.recentOrders.length && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-500 italic">No recent transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
    return (
        <div className="p-6 bg-zinc-950 border border-gold/10 hover:border-gold/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-serif text-white mb-1">{value}</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{sub}</div>
        </div>
    );
}
