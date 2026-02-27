"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";

const NAV_LEFT = [
    { label: "Shop", href: "/shop" },
    { label: "House", href: "/about" },
    { label: "Concierge", href: "/contact" },
];

export default function Header() {
    const { totalItems, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-700 h-24 flex items-center
          ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}
        >
            <div className="container-luxury grid grid-cols-3 items-center w-full">

                {/* LEFT: NAV (DESKTOP) / MENU (MOBILE) */}
                <div className="flex items-center">
                    {/* MOBILE */}
                    <div className="md:hidden">
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <button className="text-white/60 hover:text-gold transition-colors">
                                    <Menu strokeWidth={1} size={24} />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-black border-r border-white/5 w-full max-w-xs p-12 flex flex-col pt-32">
                                <SheetTitle className="hidden">Navigation Menu</SheetTitle>
                                <div className="flex flex-col gap-10">
                                    {NAV_LEFT.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-4xl font-serif text-white hover:text-gold transition-all tracking-tighter"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <Link
                                        href={user ? "/account" : "/login"}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-4xl font-serif text-white hover:text-gold transition-all tracking-tighter border-t border-white/10 pt-10"
                                    >
                                        {user ? "Account" : "Sign In"}
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* DESKTOP */}
                    <div className="hidden md:flex items-center gap-10">
                        {NAV_LEFT.map((link) => (
                            <Link key={link.href} href={link.href} className="text-[10px] uppercase tracking-[0.4em] text-white/40 hover:text-gold transition-all">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* CENTER: LOGO */}
                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="flex flex-col items-center group transition-all duration-700 transform hover:scale-105"
                    >
                        <span className="font-serif text-xl md:text-3xl tracking-[0.5em] text-gold uppercase transition-colors group-hover:text-white">
                            DINACOSMETIC
                        </span>
                    </Link>
                </div>

                {/* RIGHT: ACCOUNT & CART */}
                <div className="flex items-center justify-end gap-4 md:gap-8">
                    <Link
                        href={user ? "/account" : "/login"}
                        className="hidden md:flex items-center gap-3 group"
                    >
                        <User size={16} strokeWidth={1} className="text-white/40 group-hover:text-gold transition-colors" />
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 group-hover:text-gold transition-colors">Identity</span>
                    </Link>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="flex items-center gap-4 group relative"
                    >
                        <ShoppingBag size={18} strokeWidth={1} className="text-white/40 group-hover:text-gold transition-colors" />
                        <span className="text-[10px] uppercase font-bold text-gold tracking-widest">{totalItems}</span>
                    </button>
                </div>

            </div>
        </nav>
    );
}
