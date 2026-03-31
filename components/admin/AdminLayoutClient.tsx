"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Layers, LogOut, Store, BarChart2, Mail, LayoutPanelLeft,
  Ticket, Image as ImageIcon, Truck, ChevronRight, Menu, X,
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AdminSearch } from "./AdminSearch";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/categories", icon: Layers, label: "Categories" },
  { href: "/admin/users", icon: Users, label: "Customers" },
  { href: "/admin/marketing", icon: Ticket, label: "Marketing" },
  { href: "/admin/media", icon: ImageIcon, label: "Media" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/cms", icon: LayoutPanelLeft, label: "CMS Pages" },
  { href: "/admin/email", icon: Mail, label: "Email Settings" },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Settings",
    children: [
      { href: "/admin/settings/shipping", icon: Truck, label: "Shipping Rates" },
    ],
  },
  { href: "/admin/guide", icon: BookOpen, label: "How to Use" },
];



interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [userEmail, setUserEmail] = useState("");
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);
  const [expandedSetting, setExpandedSetting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add("admin-page");

    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("amount_total")
        .in("status", ["paid", "shipped", "delivered"])
        .gte("created_at", today.toISOString());

      const revenue = todayOrders?.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0) || 0;
      setTodayRevenue(revenue);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  const isSettingsActive = pathname.startsWith("/admin/settings");

  const SidebarNav = ({ onLinkClick }: { onLinkClick?: () => void }) => (
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
                      onClick={onLinkClick}
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
            onClick={onLinkClick}
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
            {href === "/admin/orders" && unfulfilledCount > 0 && (
              <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unfulfilledCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[#0B0B0D] text-white font-sans overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
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

        {/* Today's revenue */}
        {todayRevenue !== null && (
          <div className="mx-3 mt-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60 font-bold">Today's Revenue</p>
            <p className="text-xl font-serif text-[#D4AF37] font-bold mt-0.5">
              ${todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <SidebarNav />

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

      {/* ── MOBILE SLIDE-IN SIDEBAR OVERLAY ── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-[#0D0D0F] border-r border-white/[0.06] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile sidebar header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <Link href="/admin" className="flex flex-col">
            <span className="font-bold text-base tracking-wide text-white">
              DINA <span className="text-[#D4AF37]">ADMIN</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Command Center</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white/40 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {todayRevenue !== null && (
          <div className="mx-3 mt-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60 font-bold">Today's Revenue</p>
            <p className="text-xl font-serif text-[#D4AF37] font-bold mt-0.5">
              ${todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <SidebarNav onLinkClick={() => setMobileMenuOpen(false)} />

        <div className="p-3 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between px-2">
            <Link href="/" target="_blank" className="flex items-center gap-2 text-white/30 hover:text-[#D4AF37] transition-colors text-[11px]">
              <Store className="w-4 h-4" />
              View Store
            </Link>
            <button onClick={signOut} className="flex items-center gap-2 text-white/30 hover:text-red-400 transition-colors text-[11px]">
              <LogOut className="w-4 h-4" />
              Sign Out
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
        {/* Mobile Header with hamburger */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0D0D0F] z-20 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/admin" className="flex flex-col items-center">
            <span className="font-bold text-sm tracking-wide text-white">
              DINA <span className="text-[#D4AF37]">ADMIN</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {unfulfilledCount > 0 && (
              <Link href="/admin/orders" className="relative p-2 text-white/50 hover:text-amber-400 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 bg-amber-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {unfulfilledCount}
                </span>
              </Link>
            )}
            <Link href="/" target="_blank" className="p-2 text-white/30 hover:text-[#D4AF37] transition-colors">
              <Store className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
