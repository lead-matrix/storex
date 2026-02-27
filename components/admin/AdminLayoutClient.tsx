"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Layers,
    LogOut,
    Store,
    Vault,
    BarChart2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const NAV_ITEMS = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/vault", icon: Vault, label: "Vault" },
    { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/admin/categories", icon: Layers, label: "Categories" },
    { href: "/admin/users", icon: Users, label: "Clientele" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const [userEmail, setUserEmail] = useState("");
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        fetchUser();
    }, []);

    const signOut = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    }, []);

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* ══ SIDEBAR (DESKTOP) ══════════════════════════════════════════ */}
            <aside className="hidden md:flex w-64 bg-black border-r border-white/5 flex-col justify-between flex-shrink-0 z-20">
                <div>
                    <div className="h-24 flex items-center px-8 border-b border-white/5">
                        <Link href="/admin" className="flex flex-col group">
                            <span className="font-serif text-lg tracking-[0.4em] text-gold uppercase transition-colors group-hover:text-white">
                                OP Admin
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-[#7A746F] mt-1">Command Center</span>
                        </Link>
                    </div>

                    <nav className="p-4 space-y-2 mt-4">
                        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                            const active = exact
                                ? pathname === href
                                : pathname.startsWith(href) && href !== "/admin";
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative ${active
                                        ? "bg-white/5 text-gold"
                                        : "text-[#A9A39A] hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold rounded-r-full" />
                                    )}
                                    <Icon size={18} strokeWidth={1.5} />
                                    <span className="text-[11px] uppercase tracking-widest font-medium">
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/5 space-y-2 pb-6">
                    <Link
                        href="/"
                        className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#A9A39A] hover:bg-white/5 hover:text-white transition-all duration-300"
                    >
                        <Store size={18} strokeWidth={1.5} />
                        <span className="text-[11px] uppercase tracking-widest font-medium">Boutique View</span>
                    </Link>

                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-[#A9A39A] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        <span className="text-[11px] uppercase tracking-widest font-medium">Sign Out</span>
                    </button>

                    <div className="px-4 pt-4 mt-2 border-t border-white/5">
                        <p className="text-[9px] text-[#7A746F] tracking-widest truncate">{userEmail || "Admin"}</p>
                    </div>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
            <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-4 md:p-8 lg:p-12 pb-24 md:pb-12">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 px-4 py-3 pb-safe block">
                <div className="flex items-center justify-between">
                    {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-1 p-2 transition-all ${active ? "text-gold" : "text-[#7A746F]"
                                    }`}
                            >
                                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                                <span className="text-[8px] uppercase tracking-widest">{label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={signOut}
                        className="flex flex-col items-center gap-1 p-2 transition-all text-[#7A746F] hover:text-red-400"
                    >
                        <LogOut size={20} strokeWidth={1.5} />
                        <span className="text-[8px] uppercase tracking-widest">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
