"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Layers, LogOut, Store, BarChart2, Mail, LayoutPanelLeft,
  Ticket, Image as ImageIcon, Truck, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AdminSearch } from "./AdminSearch";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/marketing", icon: Ticket, label: "Promotions" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/media", icon: ImageIcon, label: "Media" },
  { href: "/admin/cms", icon: LayoutPanelLeft, label: "Pages" },
  { href: "/admin/categories", icon: Layers, label: "Categories" },
  { href: "/admin/users", icon: Users, label: "Customers" },
  { href: "/admin/email", icon: Mail, label: "Email Templates" },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Settings",
    children: [
      { href: "/admin/settings/shipping", icon: Truck, label: "Shipping Rates" },
    ],
  },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [userEmail, setUserEmail] = useState("");
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);
  const [expandedSetting, setExpandedSetting] = useState(false);
  const pathname = usePathname();

    useEffect(() => {
      // Apply admin theme class to body
      document.body.classList.add("admin-page");
      
      const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setUserEmail(user.email);
  
        // Fetch today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todayOrders } = await supabase
          .from("orders")
          .select("amount_total")
          .in("status", ["paid", "shipped", "delivered"])
          .gte("created_at", today.toISOString());
        
        const revenue = todayOrders?.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0) || 0;
        setTodayRevenue(revenue);
  
        // Fetch unfulfilled count
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "paid")
          .or("fulfillment_status.is.null,fulfillment_status.eq.unfulfilled");
        
        setUnfulfilledCount(count || 0);
      };
      fetchUser();

      return () => {
        document.body.classList.remove("admin-page");
      };
    }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  const isSettingsActive = pathname.startsWith("/admin/settings");

  return (
    <div className="flex h-screen bg-[#0B0B0D] text-white font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-60 bg-[#0D0D0F] border-r border-white/[0.06] flex-col flex-shrink-0 z-20">

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
          <Link href="/admin" className="flex flex-col">
            <span className="font-bold text-base tracking-wide text-white">
              DINA <span className="text-[#D4AF37]">ADMIN</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Command Center</span>
          </Link>
        </div>

        {/* Today's revenue card */}
        {todayRevenue !== null && (
          <div className="mx-3 mt-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60 font-bold">Today's Revenue</p>
            <p className="text-xl font-serif text-[#D4AF37] font-bold mt-0.5">
              ${todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact, children }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href) && href !== "/admin";

            if (children) {
              return (
                <div key={href}>
                  <button
                    onClick={() => setExpandedSetting(!expandedSetting)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-[13px] font-medium ${
                      isSettingsActive
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSettingsActive ? "text-[#D4AF37]" : "text-white/30"}`} />
                      {label}
                    </div>
                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedSetting ? "rotate-90" : ""}`} />
                  </button>
                  {(expandedSetting || isSettingsActive) && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                      {children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-[12px] font-medium ${
                            pathname === child.href
                              ? "text-[#D4AF37]"
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          <child.icon className="w-3.5 h-3.5" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-[13px] font-medium ${
                  active
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? "text-[#D4AF37]" : "text-white/30"}`} />
                  {label}
                </div>
                {/* Unfulfilled badge on Orders */}
                {href === "/admin/orders" && unfulfilledCount > 0 && (
                  <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unfulfilledCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <AdminSearch />
              <Link href="/" target="_blank" className="p-1.5 text-white/30 hover:text-[#D4AF37] transition-colors" title="View Store">
                <Store className="w-4 h-4" />
              </Link>
            </div>
            <button onClick={signOut} className="p-1.5 text-white/30 hover:text-red-400 transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="px-2 py-2 bg-black/30 rounded-lg border border-white/[0.06]">
            <p className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Signed in as</p>
            <p className="text-[11px] text-white/70 truncate mt-0.5">{userEmail || "Admin"}</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0D]">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0D0D0F] z-20">
          <Link href="/admin" className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white">
              DINA <span className="text-[#D4AF37]">ADMIN</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="text-white/30 hover:text-[#D4AF37] transition-colors">
              <Store className="w-5 h-5" />
            </Link>
            <button onClick={signOut} className="text-white/30 hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0D0D0F] border-t border-white/[0.06] z-50 px-2 py-2 pb-safe">
        <div className="flex items-center justify-between">
          {[
            { href: "/admin", icon: LayoutDashboard, label: "Home", exact: true },
            { href: "/admin/products", icon: Package, label: "Products" },
            { href: "/admin/orders", icon: ShoppingCart, label: "Orders", badge: unfulfilledCount },
            { href: "/admin/media", icon: ImageIcon, label: "Media" },
            { href: "/admin/settings", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label, exact, badge }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all relative ${
                  active ? "text-[#D4AF37]" : "text-white/30 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="absolute top-1 right-3 bg-amber-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
