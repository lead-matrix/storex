"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Layers,
    Settings,
    ExternalLink,
    ChevronRight,
    Layout,
    Mail,
    BarChart2,
    Grid,
    Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: Package, label: "Products", href: "/admin/products" },
    { icon: Grid, label: "Catalog Mode", href: "/admin/products/catalog" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
    { icon: Layers, label: "Categories", href: "/admin/categories" },
    { icon: Layout, label: "CMS Pages", href: "/admin/cms" },
    { icon: Mail, label: "Email", href: "/admin/email" },
    { icon: BarChart2, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Site Settings", href: "/admin/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-zinc-950 border-r border-white/5 flex flex-col h-screen sticky top-0">
            <div className="p-8 border-b border-white/5">
                <h1 className="text-xl font-serif text-gold tracking-[0.2em] uppercase">
                    Dina Cosmetic
                </h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                    Admin Panel
                </p>
            </div>

            <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 transition-all duration-300 group min-h-[48px]",
                                isActive
                                    ? "bg-white/5 text-gold border-l-2 border-gold"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", isActive ? "text-gold" : "text-zinc-500")} />
                                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                                    {item.label}
                                </span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 text-gold/50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/5">
                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center min-h-[48px] gap-2 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-gold transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    View Live Store
                </Link>
            </div>
        </aside>
    );
}
