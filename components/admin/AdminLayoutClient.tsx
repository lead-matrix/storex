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
    UserCircle,
    ChevronRight,
    Menu,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

const NAV_ITEMS = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/categories", icon: Layers, label: "Categories" },
    { href: "/admin/users", icon: Users, label: "Clientele" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const pathname = usePathname();

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    // Current page label for breadcrumb
    const currentPage = NAV_ITEMS.find(item =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/admin"
    )?.label ?? "Overview";

    return (
        <div className="flex min-h-screen bg-[#0d0d0d] text-white/85 font-sans overflow-x-hidden">

            {/* ── Desktop Icon Sidebar ─────────────────────────────────── */}
            <aside className="hidden md:flex w-16 flex-col items-center border-r border-white/5 bg-[#0a0a0a] sticky top-0 h-screen z-50 py-4">

                {/* Logo mark */}
                <Link href="/admin" className="w-9 h-9 mb-8 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center rounded-sm hover:bg-amber-500/20 transition-colors flex-shrink-0">
                    <span className="font-serif text-amber-400 text-[11px] font-bold">OP</span>
                </Link>

                {/* Nav icons */}
                <nav className="flex flex-col items-center gap-1 flex-grow">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={label}
                                className={`group relative w-10 h-10 flex items-center justify-center rounded-sm transition-all duration-200 ${active
                                    ? "bg-amber-500/15 text-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.15)]"
                                    : "text-white/25 hover:text-white/70 hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={17} />
                                {/* Active accent bar */}
                                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />}
                                {/* Tooltip */}
                                <div className="absolute left-12 bg-black/90 text-white/90 text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl border border-white/10 z-50">
                                    {label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom — sign out */}
                <button
                    onClick={signOut}
                    title="Sign Out"
                    className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-all group relative mt-4"
                >
                    <LogOut size={16} />
                    <div className="absolute left-12 bg-black/90 text-white/90 text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl border border-white/10 z-50">
                        Sign Out
                    </div>
                </button>
            </aside>

            {/* ── Main Area ───────────────────────────────────────────── */}
            <main className="flex-grow flex flex-col min-w-0">

                {/* Top Bar — search + breadcrumb + user */}
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0d0d0d]/90 backdrop-blur-xl sticky top-0 z-40 gap-4">

                    {/* Left: mobile menu + breadcrumb */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Mobile hamburger */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <button className="md:hidden p-1.5 text-white/30 hover:text-amber-400 transition-colors">
                                    <Menu size={18} />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-[#0a0a0a] border-r border-white/10 w-64 p-0">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Admin Navigation</SheetTitle>
                                </SheetHeader>
                                {/* Mobile sidebar — full labels */}
                                <div className="flex flex-col h-full py-4">
                                    <div className="px-5 py-4 border-b border-white/5 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                                <span className="font-serif text-amber-400 text-[11px] font-bold">OP</span>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-serif text-amber-400 tracking-widest uppercase">Obsidian Palace</p>
                                                <p className="text-[8px] text-white/25 tracking-widest uppercase mt-0.5">Admin Portal</p>
                                            </div>
                                        </div>
                                    </div>
                                    <nav className="flex-grow px-2 space-y-0.5">
                                        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                                            const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";
                                            return (
                                                <Link
                                                    key={href}
                                                    href={href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] rounded-sm transition-all ${active
                                                        ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400"
                                                        : "text-white/35 hover:text-white/70 hover:bg-white/5 border-l-2 border-transparent"
                                                        }`}
                                                >
                                                    <Icon size={14} />
                                                    {label}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                    <div className="px-2 pt-2 border-t border-white/5">
                                        <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-red-500/50 hover:text-red-400 w-full transition-colors">
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Breadcrumb */}
                        <nav className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/25 uppercase tracking-widest">
                            <span>Admin</span>
                            <ChevronRight size={10} />
                            <span className="text-amber-400/70">{currentPage}</span>
                        </nav>
                    </div>

                    {/* Center: Search */}
                    <div className="flex-grow max-w-md hidden sm:flex items-center gap-2 bg-white/4 border border-white/8 rounded-sm px-3 py-2 group focus-within:border-amber-500/30 transition-colors">
                        <Search size={13} className="text-white/25 group-focus-within:text-amber-400/60 flex-shrink-0 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search... (& K)"
                            className="bg-transparent text-[11px] text-white/60 placeholder:text-white/20 outline-none w-full tracking-wide"
                        />
                    </div>

                    {/* Right: actions + avatar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="relative w-8 h-8 flex items-center justify-center text-white/25 hover:text-amber-400 hover:bg-white/5 rounded-sm transition-colors">
                            <Bell size={15} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        </button>
                        <Link href="/" className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-amber-400 hover:bg-white/5 rounded-sm transition-colors" title="View Storefront">
                            <UserCircle size={15} />
                        </Link>
                        <div className="w-8 h-8 bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[10px] text-amber-400 font-bold rounded-sm">
                            AD
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-grow p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
