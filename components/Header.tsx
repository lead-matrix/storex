"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_LEFT = [
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
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
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-500 h-20 flex items-center
          ${scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}
            >
                <div className="container-luxury flex items-center justify-between relative h-full">

                    {/* MOBILE MENU TRIGGER */}
                    <div className="md:hidden flex-1">
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <button className="text-white hover:text-gold transition-colors">
                                    <Menu strokeWidth={1.5} />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-black border-r border-luxury-border w-full max-w-xs p-10 flex flex-col pt-24">
                                <SheetTitle className="hidden">Navigation Menu</SheetTitle>
                                <div className="flex flex-col gap-8">
                                    {NAV_LEFT.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-2xl font-serif text-white hover:text-gold transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <Link
                                        href={user ? "/account" : "/login"}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-2xl font-serif text-white hover:text-gold transition-colors border-t border-white/10 pt-8"
                                    >
                                        {user ? "Account" : "Sign In"}
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* LEFT NAV (DESKTOP) */}
                    <div className="hidden md:flex items-center gap-8 flex-1">
                        {NAV_LEFT.map((link) => (
                            <Link key={link.href} href={link.href} className="nav-link">
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* LOGO (Centered) */}
                    <Link
                        href="/"
                        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group transition-transform duration-500 hover:scale-105"
                    >
                        <span className="font-serif text-xl md:text-2xl tracking-[0.4em] text-gold uppercase transition-colors group-hover:text-gold-light">
                            DINACOSMETIC
                        </span>
                    </Link>

                    {/* RIGHT NAV */}
                    <div className="flex items-center justify-end gap-3 md:gap-5 flex-1">
                        <Link
                            href={user ? "/account" : "/login"}
                            className="flex items-center gap-2 px-3 py-1.5 border border-white/5 hover:border-gold/30 transition-all group"
                        >
                            <User size={14} strokeWidth={1.5} className="text-white/60 group-hover:text-gold transition-colors" />
                            <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-gold transition-colors hidden md:block">Account</span>
                        </Link>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="flex items-center gap-3 px-3 py-1.5 border border-white/10 hover:border-gold/50 transition-all group relative"
                        >
                            <ShoppingBag size={14} strokeWidth={1.5} className="text-white/60 group-hover:text-gold transition-colors" />
                            <span className="text-[10px] uppercase tracking-widest text-gold font-bold">{totalItems}</span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
}
