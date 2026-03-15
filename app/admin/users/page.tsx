import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { Shield, User, Mail, Calendar, TrendingUp, ShoppingBag, Filter } from "lucide-react";
import { updateUserRole } from "@/lib/actions/admin";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientele | Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
    const supabase = await createAdminClient();
    const { segment: segmentParam } = await searchParams;
    const segment = segmentParam || 'all';

    // Fetch profiles with their order counts and total spent
    const { data: users, error } = await supabase
        .from("profiles")
        .select(`
            *,
            orders:orders(amount_total, status)
        `)
        .order("created_at", { ascending: false });

    if (error) console.error("Clientele Fetch Error:", error);

    // Process data for segmentation
    const processedUsers = users?.map(user => {
        const paidOrders = user.orders?.filter((o: any) => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') || [];
        const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + (Number(o.amount_total) || 0), 0);
        const orderCount = paidOrders.length;

        let userSegment = 'Standard';
        if (totalSpent > 1000) userSegment = 'VIP';
        else if (orderCount > 1) userSegment = 'Repeat';
        else if (orderCount === 0) userSegment = 'Lead';

        return {
            ...user,
            totalSpent,
            orderCount,
            segment: userSegment
        };
    }) || [];

    // Filter by segment if requested
    const filteredUsers = segment === 'all'
        ? processedUsers
        : processedUsers.filter(u => u.segment.toLowerCase() === segment.toLowerCase());

    const segments = [
        { id: 'all', label: 'All Clients', count: processedUsers.length },
        { id: 'vip', label: 'VIP (>$1000)', count: processedUsers.filter(u => u.segment === 'VIP').length },
        { id: 'repeat', label: 'Repeat Buyers', count: processedUsers.filter(u => u.segment === 'Repeat').length },
        { id: 'lead', label: 'Leads (0 Orders)', count: processedUsers.filter(u => u.segment === 'Lead').length },
    ];

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Clientele</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Exclusive Member Directory · Behavioral Intelligence</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {segments.map(s => (
                        <a
                            key={s.id}
                            href={`?segment=${s.id}`}
                            className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap border ${segment === s.id
                                ? 'bg-charcoal text-pearl border-charcoal shadow-soft'
                                : 'bg-white text-textsoft border-charcoal/10 hover:border-gold/50'
                                }`}
                        >
                            {s.label} ({s.count})
                        </a>
                    ))}
                </div>
            </div>

            {/* SEGMENTATION KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: "Total Clientele", value: processedUsers.length, icon: User, color: "text-charcoal" },
                    { label: "VIP Assets", value: segments.find(s => s.id === 'vip')?.count || 0, icon: TrendingUp, color: "text-gold" },
                    { label: "Active Retention", value: segments.find(s => s.id === 'repeat')?.count || 0, icon: ShoppingBag, color: "text-emerald-400" },
                    { label: "Potential Growth", value: segments.find(s => s.id === 'lead')?.count || 0, icon: Mail, color: "text-blue-400" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-luxury shadow-soft border border-charcoal/10 p-6 group transition-all hover:border-gold/30">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] uppercase tracking-luxury font-bold text-textsoft/50">{s.label}</p>
                            <s.icon className={`w-4 h-4 ${s.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className={`text-4xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-luxury shadow-soft border border-charcoal/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-charcoal/5 bg-pearl/30 text-[10px] uppercase tracking-luxury text-textsoft font-bold">
                                <th className="px-8 py-5">Profile</th>
                                <th className="px-8 py-5">Intelligence</th>
                                <th className="px-8 py-5 text-center">Value (LTV)</th>
                                <th className="px-8 py-5 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-textsoft font-medium">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-charcoal/5 hover:bg-gold/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-pearl border border-charcoal/10 rounded-full flex items-center justify-center text-textsoft group-hover:border-gold/30 transition-colors shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-charcoal font-medium text-sm tracking-wide truncate group-hover:text-gold transition-colors">
                                                    {user.full_name || "Guest Client"}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-textsoft/70">
                                                    <Mail className="w-3 h-3" />
                                                    <p className="text-[10px] truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-luxury font-bold border w-fit ${user.segment === 'VIP' ? 'bg-gold/10 text-gold border-gold/20' :
                                                user.segment === 'Repeat' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-pearl text-textsoft border-charcoal/5'
                                                }`}>
                                                {user.segment}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-textsoft/50">
                                                <ShoppingBag className="w-3 h-3" />
                                                <span className="text-[9px] uppercase tracking-widest">{user.orderCount} Transactions</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-serif text-charcoal tracking-wide">${user.totalSpent.toLocaleString()}</p>
                                        <p className="text-[9px] uppercase tracking-luxury text-textsoft/40">Lifetime Contribution</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <form action={async () => {
                                                "use server";
                                                await updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
                                            }}>
                                                <button
                                                    type="submit"
                                                    className={`bg-pearl border border-charcoal/10 px-4 py-1.5 transition-all flex items-center gap-2 rounded-md shadow-sm active:scale-95 ${user.role === 'admin' ? 'text-textsoft hover:text-red-600 hover:border-red-200 hover:bg-red-50' : 'text-textsoft hover:text-charcoal hover:border-charcoal/30'
                                                        }`}
                                                >
                                                    <Shield className={`w-3 h-3 ${user.role === 'admin' ? 'text-red-500' : 'text-gold'}`} />
                                                    <span className="text-[9px] uppercase tracking-luxury font-medium">
                                                        {user.role === 'admin' ? 'Revoke Access' : 'Elevate Role'}
                                                    </span>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center text-textsoft uppercase text-[10px] tracking-luxury">
                                        No clients match this segment
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
