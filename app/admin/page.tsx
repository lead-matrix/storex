import { createClient } from "@/lib/supabase/server";
import {
    TrendingUp,
    Users,
    ShoppingBag,
    AlertCircle
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

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Fetch Stats
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'paid');

    const totalRevenue = (revenueData as { total_amount: number }[] | null)?.reduce((acc: number, curr: { total_amount: number }) => acc + (curr.total_amount || 0), 0) || 0;

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
                    value={`$${totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="text-emerald-500" />}
                    sub="Last 30 days: +12%"
                />
                <StatCard
                    label="Active Orders"
                    value={ordersCount?.toString() || "0"}
                    icon={<ShoppingBag className="text-gold" />}
                    sub="4 pending shipment"
                />
                <StatCard
                    label="Total Customers"
                    value={"1.2k"}
                    icon={<Users className="text-blue-500" />}
                    sub="+84 this week"
                />
                <StatCard
                    label="Low Stock Alerts"
                    value={"3"}
                    icon={<AlertCircle className="text-rose-500" />}
                    sub="Action required"
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
                            {(recentOrders as unknown as RecentOrder[] | null)?.map((order: RecentOrder) => (
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
                            {!recentOrders?.length && (
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
