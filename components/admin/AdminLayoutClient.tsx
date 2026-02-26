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
    X,
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
    const [searchQuery, setSearchQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [userInitials, setUserInitials] = useState("AD");
    const [userEmail, setUserEmail] = useState("");
    const pathname = usePathname();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    // Fetch real user for avatar initials
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
                const nameParts = (user.user_metadata?.full_name || user.email || "AD")
                    .split(/[\s@]/);
                const initials = nameParts
                    .slice(0, 2)
                    .map((p: string) => p[0]?.toUpperCase() ?? "")
                    .join("");
                setUserInitials(initials || "AD");
            }
        };
        fetchUser();
    }, []);

    const signOut = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    }, []);

    const currentPage =
        NAV_ITEMS.find((item) =>
            item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && item.href !== "/admin"
        )?.label ?? "Overview";

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-[#DAD5CC] font-sans overflow-x-hidden">

            {/* ══ GLOBAL COMMAND BAR ══════════════════════════════════════════ */}
            <header
                id="admin-command-bar"
                role="banner"
                aria-label="Admin navigation"
                className={`command-bar sticky top-0 z-50 h-14 flex items-center justify-between px-4 lg:px-8 gap-3 transition-all duration-300 ${scrolled ? "shadow-[0_2px_32px_rgba(0,0,0,0.6)]" : ""
                    }`}
            >
                {/* Left: Logo + breadcrumb */}
                <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                    <Link
                        href="/admin"
                        id="admin-home-logo"
                        aria-label="Admin home — Obsidian Palace"
                        className="flex items-center gap-2.5 group touch-target"
                    >
                        <div
                            className="w-7 h-7 border border-[#D4AF37]/40 flex items-center justify-center bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 transition-colors"
                            aria-hidden="true"
                        >
                            <span className="font-serif text-[#D4AF37] text-[10px] font-bold">OP</span>
                        </div>
                        <span className="hidden sm:block text-[10px] uppercase tracking-[0.4em] text-[#A9A39A] group-hover:text-[#F3EFE8] transition-colors font-light">
                            Obsidian Palace
                        </span>
                    </Link>

                    {/* Breadcrumb */}
                    <div
                        className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#7A746F] uppercase tracking-widest"
                        aria-label="Current section"
                    >
                        <ChevronRight size={9} aria-hidden="true" />
                        <span className="text-[#D4AF37]/80" aria-current="page">{currentPage}</span>
                    </div>
                </div>

                {/* Center: Omnisearch */}
                <div
                    id="admin-search"
                    className="flex-grow max-w-xs flex items-center gap-2 glass-sm px-3 h-9 group focus-within:border-[#D4AF37]/40 transition-all"
                    role="search"
                >
                    <Search
                        size={12}
                        className="text-[#7A746F] group-focus-within:text-[#D4AF37]/60 flex-shrink-0 transition-colors"
                        aria-hidden="true"
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search…  ⌘K"
                        aria-label="Admin search"
                        className="bg-transparent text-[11px] text-[#DAD5CC] placeholder:text-[#7A746F] outline-none w-full tracking-wide"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                            className="text-[#7A746F] hover:text-[#A9A39A] transition-colors flex-shrink-0"
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>

                {/* Right: desktop nav icons */}
                <nav
                    className="hidden md:flex items-center gap-0.5"
                    aria-label="Admin sections"
                >
                    {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                id={`admin-nav-${label.toLowerCase()}`}
                                aria-label={label}
                                aria-current={active ? "page" : undefined}
                                title={label}
                                className={`group relative w-9 h-9 flex items-center justify-center rounded-sm transition-all duration-200 ${active
                                        ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                                        : "text-[#7A746F] hover:text-[#DAD5CC] hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={15} aria-hidden="true" />
                                {/* Active indicator */}
                                {active && (
                                    <div
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-[#D4AF37] rounded-full"
                                        aria-hidden="true"
                                    />
                                )}
                                {/* Tooltip */}
                                <div
                                    className="absolute top-11 left-1/2 -translate-x-1/2 bg-[#050505] border border-[#D4AF37]/15 text-[#DAD5CC] text-[9px] uppercase tracking-widest px-2.5 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50"
                                    role="tooltip"
                                >
                                    {label}
                                </div>
                            </Link>
                        );
                    })}

                    <div className="w-px h-5 bg-white/8 mx-1" aria-hidden="true" />

                    {/* View Store */}
                    <Link
                        href="/"
                        id="admin-view-store"
                        aria-label="View live storefront"
                        title="View Storefront"
                        className="w-9 h-9 flex items-center justify-center text-[#7A746F] hover:text-[#D4AF37]/80 hover:bg-white/5 rounded-sm transition-all"
                    >
                        <Store size={15} aria-hidden="true" />
                    </Link>

                    {/* Sign Out */}
                    <button
                        id="admin-signout"
                        onClick={signOut}
                        aria-label="Sign out of admin panel"
                        title="Sign Out"
                        className="w-9 h-9 flex items-center justify-center text-[#7A746F] hover:text-red-400 hover:bg-red-500/8 rounded-sm transition-all"
                    >
                        <LogOut size={15} aria-hidden="true" />
                    </button>

                    {/* Bell */}
                    <button
                        id="admin-bell"
                        aria-label="Notifications"
                        className="relative w-9 h-9 flex items-center justify-center text-[#7A746F] hover:text-[#D4AF37]/80 hover:bg-white/5 rounded-sm transition-all"
                    >
                        <Bell size={15} aria-hidden="true" />
                        <span
                            className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"
                            aria-label="1 notification"
                        />
                    </button>

                    {/* User Avatar with real initials */}
                    <div
                        title={userEmail}
                        aria-label={`Signed in as ${userEmail || "admin"}`}
                        className="w-7 h-7 bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[9px] text-[#D4AF37] font-bold ml-1 rounded-sm cursor-default select-none"
                    >
                        {userInitials}
                    </div>
                </nav>
            </header>

            {/* ══ PAGE CONTENT ════════════════════════════════════════════════ */}
            <main className="flex-grow p-4 md:p-6 lg:p-8 pb-24 md:pb-8 page-enter">
                {children}
            </main>

            {/* ══ GLASS DOCK — Mobile Bottom Nav ══════════════════════════════ */}
            <nav
                id="admin-glass-dock"
                className="mobile-dock md:hidden"
                aria-label="Admin mobile navigation"
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
                                aria-label={label}
                                aria-current={active ? "page" : undefined}
                                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-sm transition-all duration-200 min-h-[44px] min-w-[44px] justify-center ${active
                                        ? "text-[#D4AF37]"
                                        : "text-[#7A746F] hover:text-[#A9A39A]"
                                    }`}
                            >
                                <div className={`relative ${active ? "filter-gold-glow" : ""}`}>
                                    <Icon size={18} aria-hidden="true" />
                                    {active && (
                                        <div
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-[#D4AF37] rounded-full"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <span className="text-[7px] uppercase tracking-widest font-light">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Sign out on mobile */}
                    <button
                        onClick={signOut}
                        aria-label="Sign out"
                        className="flex flex-col items-center gap-1 px-2 py-2 text-[#7A746F] hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] justify-center"
                    >
                        <LogOut size={18} aria-hidden="true" />
                        <span className="text-[7px] uppercase tracking-widest font-light">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
