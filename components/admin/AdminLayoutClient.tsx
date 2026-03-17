"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Layers,
    LogOut,
    Store,
    BarChart2,
    Mail,
    LayoutPanelLeft,
    Ticket,
    Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AdminSearch } from "./AdminSearch";

const NAV_ITEMS = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/marketing", icon: Ticket, label: "Marketing" },
    { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/admin/media", icon: ImageIcon, label: "Media Library" },
    { href: "/admin/cms", icon: LayoutPanelLeft, label: "Experiences" },
    { href: "/admin/categories", icon: Layers, label: "Categories" },
    { href: "/admin/users", icon: Users, label: "Clientele" },
    { href: "/admin/email", icon: Mail, label: "Email Design" },
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
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* ══ SIDEBAR (DESKTOP) ══════════════════════════════════════════ */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col justify-between flex-shrink-0 z-20 shadow-sm">
                <div className="flex-1 overflow-y-auto">
                    <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <Link href="/admin" className="flex flex-col">
                            <span className="font-bold text-lg tracking-wide text-charcoal">
                                DINA <span className="text-gold">ADMIN</span>
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-textsoft font-bold">Admin Portal</span>
                        </Link>
                    </div>

                    <nav className="p-4 space-y-1 mt-2">
                        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                            const active = exact
                                ? pathname === href
                                : pathname.startsWith(href) && href !== "/admin";
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${active
                                        ? "bg-charcoal text-white shadow-soft"
                                        : "text-textsoft hover:bg-pearl hover:text-charcoal"
                                        }`}
                                >
                                    <Icon size={18} strokeWidth={2} className={active ? "text-gold" : "text-textsoft/60"} />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100 bg-pearl/20 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <AdminSearch />
                            <Link href="/" target="_blank" className="p-2 text-textsoft/60 hover:text-gold transition-colors" title="View Store">
                                <Store size={18} />
                            </Link>
                        </div>
                        <button onClick={signOut} className="p-2 text-textsoft/60 hover:text-red-500 transition-colors" title="Sign Out">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <div className="px-3 py-2 bg-white rounded-luxury border border-charcoal/5 shadow-sm">
                        <p className="text-[8px] uppercase tracking-luxury text-textsoft font-bold mb-0.5">Logged in as</p>
                        <p className="text-[10px] text-charcoal font-medium truncate">{userEmail || "Admin User"}</p>
                    </div>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8 lg:p-10 pb-24 md:pb-10 scroll-smooth">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 px-2 py-2 pb-safe block shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between">
                    {[
                        { href: "/admin", icon: LayoutDashboard, label: "Home", exact: true },
                        { href: "/admin/products", icon: Package, label: "Products" },
                        { href: "/admin/orders", icon: ShoppingCart, label: "Cart" },
                        { href: "/admin/media", icon: ImageIcon, label: "Media" },
                        { href: "/admin/settings", icon: Settings, label: "Config" }
                    ].map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all ${active ? "text-gold" : "text-textsoft"}`}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
