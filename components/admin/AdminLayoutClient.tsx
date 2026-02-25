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
    Search,
    Bell,
    Store,
    Vault,
    BarChart2,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

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

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const currentPage = NAV_ITEMS.find((item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/admin"
    )?.label ?? "Overview";

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-white/85 font-sans overflow-x-hidden">

            {/* ══ FLOATING GLOBAL COMMAND BAR (Top) ══════════════════════════ */}
            <header
                id="admin-command-bar"
                className={`command-bar sticky top-0 z-50 h-14 flex items-center justify-between px-4 lg:px-8 gap-4 transition-all duration-300 ${scrolled ? "shadow-[0_2px_32px_rgba(0,0,0,0.5)]" : ""}`}
            >
                {/* Left: Logo + breadcrumb */}
                <div className="flex items-center gap-4 min-w-0">
                    <Link
                        href="/admin"
                        id="admin-home-logo"
                        className="flex items-center gap-2 flex-shrink-0 group"
                    >
                        <div className="w-7 h-7 border border-[#D4AF37]/40 flex items-center justify-center bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors">
                            <span className="font-serif text-[#D4AF37] text-[10px] font-bold">OP</span>
                        </div>
                        <span className="hidden sm:block text-[10px] uppercase tracking-[0.4em] text-white/40 group-hover:text-white/70 transition-colors font-light">
                            Obsidian Palace
                        </span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/20 uppercase tracking-widest">
                        <ChevronRight size={9} />
                        <span className="text-[#D4AF37]/60">{currentPage}</span>
                    </div>
                </div>

                {/* Center: Omnisearch */}
                <div
                    id="admin-search"
                    className="flex-grow max-w-sm flex items-center gap-2 glass-sm px-3 py-2 group focus-within:border-[#D4AF37]/40 transition-all"
                >
                    <Search size={12} className="text-white/25 group-focus-within:text-[#D4AF37]/60 flex-shrink-0 transition-colors" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Command search…  ⌘K"
                        className="bg-transparent text-[11px] text-white/60 placeholder:text-white/18 outline-none w-full tracking-wide"
                    />
                </div>

                {/* Right: nav icons — desktop */}
                <nav className="hidden md:flex items-center gap-1">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                id={`admin-nav-${label.toLowerCase()}`}
                                title={label}
                                className={`group relative w-9 h-9 flex items-center justify-center rounded-sm transition-all duration-200 ${active
                                        ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                                        : "text-white/25 hover:text-white/65 hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={15} />
                                {/* Active dot */}
                                {active && (
                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-[#D4AF37] rounded-full" />
                                )}
                                {/* Tooltip */}
                                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-[#050505] border border-[#D4AF37]/15 text-white/80 text-[9px] uppercase tracking-widest px-2.5 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                                    {label}
                                </div>
                            </Link>
                        );
                    })}

                    <div className="w-px h-6 bg-white/8 mx-1" />

                    <Link
                        href="/"
                        id="admin-view-store"
                        title="View Storefront"
                        className="w-9 h-9 flex items-center justify-center text-white/20 hover:text-[#D4AF37]/70 hover:bg-white/5 rounded-sm transition-all"
                    >
                        <Store size={15} />
                    </Link>
                    <button
                        id="admin-signout"
                        onClick={signOut}
                        title="Sign Out"
                        className="w-9 h-9 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/8 rounded-sm transition-all"
                    >
                        <LogOut size={15} />
                    </button>

                    {/* Bell */}
                    <button
                        id="admin-bell"
                        className="relative w-9 h-9 flex items-center justify-center text-white/20 hover:text-[#D4AF37]/70 hover:bg-white/5 rounded-sm transition-all"
                    >
                        <Bell size={15} />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                    </button>

                    {/* Avatar */}
                    <div className="w-7 h-7 bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center text-[9px] text-[#D4AF37] font-bold ml-1">
                        AD
                    </div>
                </nav>
            </header>

            {/* ══ PAGE CONTENT ═══════════════════════════════════════════════ */}
            <main className="flex-grow p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                {children}
            </main>

            {/* ══ GLASS DOCK (Mobile Bottom Nav) ═════════════════════════════ */}
            <nav
                id="admin-glass-dock"
                className="mobile-dock md:hidden"
            >
                <div className="flex items-center justify-around px-2 py-2">
                    {NAV_ITEMS.slice(0, 6).map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                id={`dock-${label.toLowerCase()}`}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-sm transition-all duration-200 min-h-[44px] justify-center ${active
                                        ? "text-[#D4AF37]"
                                        : "text-white/25 hover:text-white/60"
                                    }`}
                            >
                                <div className={`relative ${active ? "filter-gold-glow" : ""}`}>
                                    <Icon size={18} />
                                    {active && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-[#D4AF37] rounded-full" />
                                    )}
                                </div>
                                <span className="text-[7px] uppercase tracking-widest font-light">{label}</span>
                            </Link>
                        );
                    })}

                    {/* More — sign out */}
                    <button
                        onClick={signOut}
                        className="flex flex-col items-center gap-1 px-3 py-2 text-white/20 hover:text-red-400 transition-colors min-h-[44px] justify-center"
                    >
                        <LogOut size={18} />
                        <span className="text-[7px] uppercase tracking-widest font-light">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
