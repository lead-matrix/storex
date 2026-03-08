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
    Vault,
    BarChart2,
    Mail,
    LayoutPanelLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const NAV_ITEMS = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/vault", icon: Vault, label: "Vault" },
    { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/admin/builder", icon: LayoutPanelLeft, label: "Page Builder" },
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
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col justify-between flex-shrink-0 z-20">
                <div>
                    <div className="h-20 flex items-center px-6 border-b border-gray-200">
                        <Link href="/admin" className="flex flex-col">
                            <span className="font-bold text-lg tracking-wide text-gray-900">
                                Admin Portal
                            </span>
                            <span className="text-xs text-gray-500">Operation Center</span>
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
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={18} strokeWidth={2} className={active ? "text-gray-900" : "text-gray-500"} />
                                    <span>
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-200 space-y-1 pb-6">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <Store size={18} strokeWidth={2} />
                        <span>Storefront</span>
                    </Link>

                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} strokeWidth={2} />
                        <span>Sign Out</span>
                    </button>

                    <div className="px-3 pt-3 mt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 truncate">{userEmail || "Admin User"}</p>
                    </div>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8 lg:p-10 pb-24 md:pb-10">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 px-2 py-2 pb-safe block shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                    {[
                        { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
                        { href: "/admin/products", icon: Package, label: "Products" },
                        { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
                        { href: "/admin/settings", icon: Settings, label: "Settings" }
                    ].map(({ href, icon: Icon, label, exact }) => {
                        const active = exact
                            ? pathname === href
                            : pathname.startsWith(href) && href !== "/admin";
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${active ? "text-gray-900" : "text-gray-500"
                                    }`}
                            >
                                <Icon size={20} className={active ? "text-gray-900 drop-shadow-sm" : ""} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={signOut}
                        className="flex flex-col items-center gap-1 p-2 flex-1 transition-colors text-gray-500 hover:text-red-600"
                    >
                        <LogOut size={20} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}

