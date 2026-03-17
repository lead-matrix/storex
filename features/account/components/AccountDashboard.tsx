"use client"

import Link from "next/link"
import { Package, User, ChevronRight, Settings } from "lucide-react"

interface Order {
    id: string;
    created_at: string;
    amount_total: number;
    status: string;
    tracking_number?: string;
    order_items: {
        quantity: number;
        products: {
            title: string;
            images: string[];
        } | null;
        product_variants: {
            image_url: string;
        } | null;
    }[];
}

interface AccountDashboardProps {
    user: {
        email?: string
        created_at: string
    }
    profile: {
        full_name?: string
        role?: string
    }
    orders?: Order[];
}

export function AccountDashboard({ user, profile, orders = [] }: AccountDashboardProps) {
    const userName = profile?.full_name || user.email?.split("@")[0] || "Guest"
    const userRole = profile?.role || "customer"

    return (
        <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000">
            {/* HERITAGE HEADER */}
            <div className="text-center space-y-6">
                <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-medium">The Obsidian Palace</p>
                <h1 className="text-4xl md:text-6xl font-serif text-white uppercase italic tracking-wide">
                    Identity
                </h1>
                <p className="text-luxury-subtext font-light tracking-wide max-w-lg mx-auto text-sm leading-relaxed">
                    Welcome back, {userName}. Manage your coordinates and view order artifacts.
                </p>
            </div>

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PROFILE CARD */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-8 hover:border-gold/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                            <User size={20} className="text-white/60" strokeWidth={1.5} />
                        </div>
                        <div className="px-3 py-1 bg-black text-[9px] font-bold uppercase tracking-widest text-gold border border-gold/20 rounded-full">
                            {userRole}
                        </div>
                    </div>
                    <h3 className="text-xl font-serif mb-4 text-white uppercase tracking-widest">Profile Identity</h3>
                    <p className="text-sm text-luxury-subtext mb-2 font-light">{user.email}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest pt-4 border-t border-white/5 mt-6">
                        Member since {new Date(user.created_at).getFullYear()}
                    </p>
                </div>

                {/* ADDRESS BOOK (PLACERHOLDER) */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-8 hover:border-gold/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                            <Settings size={20} className="text-white/60" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h3 className="text-xl font-serif mb-4 text-white uppercase tracking-widest">Coordinates</h3>
                    <p className="text-sm text-luxury-subtext mb-2 font-light line-clamp-2">
                        No default delivery coordinates set. Provide details during your next artifact securement.
                    </p>
                </div>

                {/* ADMIN ACCESS */}
                {userRole === 'admin' && (
                    <Link
                        href="/admin"
                        className="md:col-span-2 group bg-gold/5 border border-gold/20 rounded-xl p-8 hover:bg-gold/10 hover:border-gold transition-all duration-500 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-xl font-serif mb-2 text-gold uppercase tracking-widest">Admin Portal Access</h3>
                            <p className="text-sm text-gold/60 font-light">Bridge to the grand orchestrator interface.</p>
                        </div>
                        <ChevronRight size={20} className="text-gold group-hover:translate-x-2 transition-transform duration-300" strokeWidth={1.5} />
                    </Link>
                )}
            </div>

            {/* ORDERS TABLE SECTION */}
            <div className="space-y-8">
                <h3 className="text-2xl font-serif text-white uppercase tracking-widest border-b border-white/10 pb-4">
                    Artifact Vault (Orders)
                </h3>

                {orders.length === 0 ? (
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-16 text-center">
                        <Package size={32} className="text-white/20 mx-auto mb-6" strokeWidth={1} />
                        <p className="text-luxury-subtext uppercase tracking-widest text-[11px] font-light">
                            No artifacts claimed yet. The Palace awaits your selection.
                        </p>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-luxury-subtext font-light border-collapse">
                                <thead className="bg-black/50 text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-normal">Order Artifact</th>
                                        <th className="px-6 py-4 font-normal">History</th>
                                        <th className="px-6 py-4 font-normal">Manifest</th>
                                        <th className="px-6 py-4 font-normal text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map((order) => {
                                        const isPaid = order.status === 'paid' || order.status === 'completed';
                                        return (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="space-y-3">
                                                        <span className="text-white font-medium uppercase tracking-wider text-[11px]">
                                                            Ref: #{order.id.split('-')[0]}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            {order.order_items.map((item, idx) => {
                                                                const displayImg = item.product_variants?.image_url || item.products?.images?.[0] || "/logo.jpg";
                                                                return (
                                                                    <div key={idx} className="w-8 h-8 rounded-full border border-black bg-zinc-900 overflow-hidden relative" title={item.products?.title}>
                                                                        <img src={displayImg} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-[11px] uppercase tracking-widest opacity-60">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-widest border ${isPaid
                                                        ? 'border-gold/30 text-gold bg-gold/5'
                                                        : 'border-white/10 text-white/40 bg-white/5'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-white group-hover:text-gold transition-colors">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="text-sm tracking-widest">${Number(order.amount_total).toFixed(2)}</span>
                                                        {order.tracking_number && (
                                                            <a
                                                                href={`https://goshippo.com/tracking/${order.tracking_number}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[9px] text-gold/60 hover:text-gold underline decoration-gold/20 flex items-center gap-1 transition-colors uppercase tracking-widest"
                                                            >
                                                                Track Manifest
                                                                <ChevronRight size={10} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
