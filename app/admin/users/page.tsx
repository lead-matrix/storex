import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { Shield, User, Mail, Calendar, TrendingUp, ShoppingBag, Search } from "lucide-react";
import { updateUserRole } from "@/lib/actions/admin";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customers | Admin" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ segment?: string, q?: string }> }) {
    const supabase = await createAdminClient();
    const { segment: segmentParam, q: query } = await searchParams;
    const segment = segmentParam || 'all';

    // 1. Fetch all profiles to know who is registered and their roles
    const { data: profiles, error: profileErr } = await supabase.from("profiles").select("*");

    // 2. Fetch all REAL orders (paid, shipped, delivered) to build the real customer list
    // We explicitly exclude "pending" or "cancelled" or "refunded" to avoid the mess.
    const { data: orders, error: orderErr } = await supabase
        .from("orders")
        .select("id, customer_email, customer_name, amount_total, created_at")
        .in("status", ["paid", "shipped", "delivered"]);

    if (profileErr) console.error("Profiles Fetch Error:", profileErr);
    if (orderErr) console.error("Orders Fetch Error:", orderErr);

    // 3. Aggregate orders by exact customer_email to calculate LTV and transaction counts
    const customerMap = new Map<string, any>();

    // First process all real orders to group by email
    orders?.forEach((o: any) => {
        const email = o.customer_email?.toLowerCase().trim();
        if (!email) return;

        if (!customerMap.has(email)) {
            customerMap.set(email, {
                id: `guest-${email}`, // temporary ID
                email: email,
                full_name: o.customer_name || 'Guest Client',
                role: 'user', // default
                isRegistered: false,
                totalSpent: 0,
                orderCount: 0,
                segment: 'Standard',
                profileId: null
            });
        }

        const c = customerMap.get(email);
        c.totalSpent += (Number(o.amount_total) || 0);
        c.orderCount += 1;
    });

    // Now merge in registered profiles (if a profile hasn't bought anything, they are a 'Lead')
    profiles?.forEach((p: any) => {
        const email = p.email?.toLowerCase().trim();
        if (!email) return;

        if (customerMap.has(email)) {
            // Update the existing real customer with their profile ID and role
            const c = customerMap.get(email);
            c.id = p.id;
            c.profileId = p.id;
            c.role = p.role;
            c.isRegistered = true;
            // Name preference: profile name > order checkout name
            if (p.full_name) c.full_name = p.full_name;
        } else {
            // They registered but never bought anything (or only have pending failed orders)
            // They are a real Lead
            customerMap.set(email, {
                id: p.id,
                email: email,
                full_name: p.full_name || 'Registered Lead',
                role: p.role,
                isRegistered: true,
                totalSpent: 0,
                orderCount: 0,
                segment: 'Lead',
                profileId: p.id
            });
        }
    });

    // Convert map to array and apply accurate segmentation logic
    let processedUsers = Array.from(customerMap.values()).map(user => {
        let userSegment = 'Standard';
        if (user.orderCount === 0) userSegment = 'Lead';
        else if (user.totalSpent > 1000) userSegment = 'VIP';
        else if (user.orderCount > 1) userSegment = 'Repeat';

        return { ...user, segment: userSegment };
    });

    // Apply text search if queried
    if (query) {
        const q = query.toLowerCase();
        processedUsers = processedUsers.filter(u => 
            u.email.toLowerCase().includes(q) || 
            (u.full_name && u.full_name.toLowerCase().includes(q))
        );
    }

    // Sort by Total Spent descending, then by order count
    processedUsers.sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount);

    // Filter by segment tab
    const filteredUsers = segment === 'all'
        ? processedUsers
        : processedUsers.filter(u => u.segment.toLowerCase() === segment.toLowerCase());

    const segments = [
        { id: 'all', label: 'All Clients', count: processedUsers.length },
        { id: 'vip', label: 'VIP (>$1000)', count: processedUsers.filter(u => u.segment === 'VIP').length },
        { id: 'repeat', label: 'Repeat Buyers', count: processedUsers.filter(u => u.segment === 'Repeat').length },
        { id: 'standard', label: 'Standard (1 Order)', count: processedUsers.filter(u => u.segment === 'Standard').length },
        { id: 'lead', label: 'Leads (0 Orders)', count: processedUsers.filter(u => u.segment === 'Lead').length },
    ];

    return (
        <div className="space-y-8 pb-24 animate-luxury-fade">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading text-white mb-2 tracking-luxury">Customers</h1>
                    <p className="text-luxury-subtext text-xs uppercase tracking-luxury font-medium">Real Buyers & leads · Behavioral Intelligence</p>
                </div>

                <div className="flex flex-col gap-4">
                    <form action="" className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-subtext/30 group-focus-within:text-gold transition-colors" />
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Identify member by name or email..."
                            className="w-full bg-[#121214] border border-white/5 rounded-luxury pl-11 pr-4 py-3 text-[11px] uppercase tracking-luxury text-white outline-none focus:border-gold/30 focus:bg-[#0B0B0D] transition-all shadow-sm"
                        />
                        {segment !== 'all' && <input type="hidden" name="segment" value={segment} />}
                    </form>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x">
                        {segments.map(s => (
                            <a
                                key={s.id}
                                href={`?segment=${s.id}${query ? `&q=${query}` : ''}`}
                                className={`snap-start px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap border ${segment === s.id
                                    ? 'bg-white text-[#0B0B0D] border-white/10 shadow-soft'
                                    : 'bg-[#0B0B0D] text-luxury-subtext border-white/10 hover:border-gold/50'
                                    }`}
                            >
                                {s.label} <span className="opacity-50">({s.count})</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* SEGMENTATION KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Result Set", value: processedUsers.length, icon: User, color: "text-white" },
                    { label: "VIP Clients", value: segments.find(s => s.id === 'vip')?.count || 0, icon: TrendingUp, color: "text-gold" },
                    { label: "Active Retention", value: segments.find(s => s.id === 'repeat')?.count || 0, icon: ShoppingBag, color: "text-emerald-400" },
                    { label: "Potential Growth (Leads)", value: segments.find(s => s.id === 'lead')?.count || 0, icon: Mail, color: "text-blue-400" },
                ].map((k) => (
                    <div key={k.label} className="bg-[#0B0B0D] rounded-luxury shadow-soft border border-white/10 p-5 group transition-all hover:border-gold/30">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] w-2/3 uppercase tracking-luxury font-bold text-luxury-subtext/50">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color} opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                        </div>
                        <p className={`text-3xl font-serif ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-3">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-[#0B0B0D] rounded-xl border border-white/10 p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#121214] border border-white/10 rounded-full flex items-center justify-center text-luxury-subtext shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white font-medium text-sm truncate">{user.full_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-luxury-subtext/70">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <p className="text-[10px] truncate">{user.email}</p>
                                </div>
                            </div>
                            {!user.isRegistered && (
                                <span className="text-[8px] bg-white/5 text-white/40 px-2 py-1 rounded-sm uppercase tracking-widest border border-white/10">Guest</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-y border-white/5 py-3">
                            <div>
                                <p className="text-[9px] uppercase tracking-luxury text-luxury-subtext/40 mb-1">Intelligence</p>
                                <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-luxury font-bold border inline-block mb-1 ${
                                    user.segment === 'VIP' ? 'bg-gold/10 text-gold border-gold/20' :
                                    user.segment === 'Repeat' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    user.segment === 'Standard' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-[#121214] text-luxury-subtext border-white/5'
                                }`}>
                                    {user.segment}
                                </span>
                                <p className="text-[10px] text-white/50">{user.orderCount} Orders</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-luxury text-luxury-subtext/40 mb-1">Value (LTV)</p>
                                <p className="text-lg font-serif text-white tracking-wide">${user.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        {user.profileId && (
                            <form action={async () => {
                                "use server";
                                await updateUserRole(user.profileId!, user.role === 'admin' ? 'user' : 'admin');
                            }}>
                                <button
                                    type="submit"
                                    className={`w-full py-2.5 transition-all flex items-center justify-center gap-2 rounded-lg border ${
                                        user.role === 'admin' 
                                        ? 'bg-red-500/5 text-red-400 border-red-500/20' 
                                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">
                                        {user.role === 'admin' ? 'Revoke Admin' : 'Elevate to Admin'}
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="bg-[#0B0B0D] rounded-xl border border-white/10 p-8 text-center text-luxury-subtext uppercase text-[10px] tracking-luxury">
                        No clients match this identity check
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-[#0B0B0D] rounded-luxury shadow-soft border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-[#0B0B0D]/5 text-[10px] uppercase tracking-luxury text-luxury-subtext font-bold">
                                <th className="px-8 py-5">Profile</th>
                                <th className="px-8 py-5">Intelligence</th>
                                <th className="px-8 py-5 text-center">Value (LTV)</th>
                                <th className="px-8 py-5 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] text-luxury-subtext font-medium">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-gold/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#121214] border border-white/10 rounded-full flex items-center justify-center text-luxury-subtext group-hover:border-gold/30 transition-colors shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-medium text-sm tracking-wide truncate group-hover:text-gold transition-colors">
                                                        {user.full_name}
                                                    </p>
                                                    {!user.isRegistered && (
                                                        <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded-sm uppercase tracking-widest border border-white/10">Guest</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-luxury-subtext/70">
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
                                                user.segment === 'Standard' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-[#121214] text-luxury-subtext border-white/5'
                                                }`}>
                                                {user.segment}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-luxury-subtext/50">
                                                <ShoppingBag className="w-3 h-3" />
                                                <span className="text-[9px] uppercase tracking-widest">{user.orderCount} Transactions</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-serif text-white tracking-wide">${user.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p className="text-[9px] uppercase tracking-luxury text-luxury-subtext/40">Lifetime Contribution</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {user.profileId ? (
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <form action={async () => {
                                                    "use server";
                                                    await updateUserRole(user.profileId!, user.role === 'admin' ? 'user' : 'admin');
                                                }}>
                                                    <button
                                                        type="submit"
                                                        className={`bg-[#121214] border border-white/10 px-4 py-1.5 transition-all flex items-center gap-2 rounded-md shadow-sm active:scale-95 ${user.role === 'admin' ? 'text-luxury-subtext hover:text-red-600 hover:border-red-200 hover:bg-red-50' : 'text-luxury-subtext hover:text-white hover:border-white/10/30'
                                                            }`}
                                                    >
                                                        <Shield className={`w-3 h-3 ${user.role === 'admin' ? 'text-red-500' : 'text-gold'}`} />
                                                        <span className="text-[9px] uppercase tracking-luxury font-medium">
                                                            {user.role === 'admin' ? 'Revoke Access' : 'Elevate Role'}
                                                        </span>
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] uppercase tracking-luxury text-luxury-subtext/40 italic">Guest Checkout</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center text-luxury-subtext uppercase text-[10px] tracking-luxury">
                                        No clients match this identity check
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
