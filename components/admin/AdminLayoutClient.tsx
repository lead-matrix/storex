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
        <div className="flex flex-col min-h-screen bg-pearl text-charcoal font-sans overflow-x-hidden">

            {/* ══ GLOBAL COMMAND BAR ══════════════════════════════════════════ */}
            <header
                id="admin-command-bar"
                role="banner"
                aria-label="Admin navigation"
                className={`command-bar sticky top-0 z-50 h-14 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 gap-3 transition-all duration-300 border-b border-charcoal/5 ${scrolled ? "shadow-soft" : ""
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
                            className="w-7 h-7 border border-gold/40 flex items-center justify-center bg-gold/5 group-hover:bg-gold/15 transition-colors rounded-sm"
                            aria-hidden="true"
                        >
                            <span className="font-heading text-gold text-[10px] font-bold">OP</span>
                        </div>
                        <span className="hidden sm:block text-[10px] uppercase tracking-luxury text-textsoft group-hover:text-charcoal transition-colors font-medium">
                            Obsidian Palace
                        </span>
                    </Link>

                    {/* Breadcrumb */}
                    <div
                        className="hidden sm:flex items-center gap-1.5 text-[10px] text-textsoft uppercase tracking-luxury"
                        aria-label="Current section"
                    >
                        <ChevronRight size={10} aria-hidden="true" />
                        <span className="text-charcoal font-medium" aria-current="page">{currentPage}</span>
                    </div>
                </div>

                {/* Center: Omnisearch */}
                <div
                    id="admin-search"
                    className="flex-grow max-w-xs flex items-center gap-2 bg-pearl px-3 h-9 rounded-md group focus-within:border-gold/40 border border-charcoal/10 transition-all"
                    role="search"
                >
                    <Search
                        size={12}
                        className="text-textsoft group-focus-within:text-gold flex-shrink-0 transition-colors"
                        aria-hidden="true"
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search…  ⌘K"
                        aria-label="Admin search"
                        className="bg-transparent text-[11px] text-charcoal placeholder:text-textsoft/70 outline-none w-full tracking-wide"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                            className="text-textsoft hover:text-charcoal transition-colors flex-shrink-0"
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
                                    ? "bg-gold/10 text-gold shadow-sm"
                                    : "text-textsoft hover:text-charcoal hover:bg-charcoal/5"
                                    }`}
                            >
                                <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                                {/* Active indicator */}
                                {active && (
                                    <div
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-gold rounded-full"
                                        aria-hidden="true"
                                    />
                                )}
                                {/* Tooltip */}
                                <div
                                    className="absolute top-11 left-1/2 -translate-x-1/2 bg-white border border-charcoal/10 shadow-soft text-charcoal text-[9px] uppercase tracking-luxury px-2.5 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 rounded"
                                    role="tooltip"
                                >
                                    {label}
                                </div>
                            </Link>
                        );
                    })}

                    <div className="w-px h-5 bg-charcoal/10 mx-1" aria-hidden="true" />

                    {/* View Store */}
                    <Link
                        href="/"
                        id="admin-view-store"
                        aria-label="View live storefront"
                        title="View Storefront"
                        className="w-9 h-9 flex items-center justify-center text-textsoft hover:text-gold hover:bg-gold/5 rounded-sm transition-all"
                    >
                        <Store size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Link>

                    {/* Sign Out */}
                    <button
                        id="admin-signout"
                        onClick={signOut}
                        aria-label="Sign out of admin panel"
                        title="Sign Out"
                        className="w-9 h-9 flex items-center justify-center text-textsoft hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                    >
                        <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>

                    {/* Bell */}
                    <button
                        id="admin-bell"
                        aria-label="Notifications"
                        className="relative w-9 h-9 flex items-center justify-center text-textsoft hover:text-gold hover:bg-gold/5 rounded-sm transition-all"
                    >
                        <Bell size={16} strokeWidth={1.5} aria-hidden="true" />
                        <span
                            className="absolute top-2 right-2 w-1.5 h-1.5 bg-gold rounded-full"
                            aria-label="1 notification"
                        />
                    </button>

                    {/* User Avatar with real initials */}
                    <div
                        title={userEmail}
                        aria-label={`Signed in as ${userEmail || "admin"}`}
                        className="w-7 h-7 bg-white border border-charcoal/10 flex items-center justify-center text-[9px] text-charcoal font-medium ml-1 rounded-sm cursor-default select-none shadow-sm"
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
                className="mobile-dock md:hidden bg-white border-t border-charcoal/10 fixed bottom-0 w-full z-50 pb-safe"
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
                                    ? "text-gold"
                                    : "text-textsoft hover:text-charcoal"
                                    }`}
                            >
                                <div className={`relative`}>
                                    <Icon size={18} aria-hidden="true" strokeWidth={active ? 2 : 1.5} />
                                    {active && (
                                        <div
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-[2px] bg-gold rounded-full"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <span className="text-[7px] uppercase tracking-luxury font-medium">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Sign out on mobile */}
                    <button
                        onClick={signOut}
                        aria-label="Sign out"
                        className="flex flex-col items-center gap-1 px-2 py-2 text-textsoft hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] justify-center"
                    >
                        <LogOut size={18} aria-hidden="true" strokeWidth={1.5} />
                        <span className="text-[7px] uppercase tracking-luxury font-medium">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
