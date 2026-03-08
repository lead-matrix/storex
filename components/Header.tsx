"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";

export default function Header({ navItems = [] }: { navItems?: { label: string, href: string, is_active?: boolean }[] }) {
    const { totalItems, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const supabase = createClient();
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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

    const links = navItems.length > 0 ? navItems : [
        { label: 'Shop', href: '/shop' },
        { label: 'Collections', href: '/collections' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' }
    ];

    if (pathname?.startsWith('/admin')) return null;

    return (
        <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-md border-b border-white/10 
            ${scrolled ? "bg-black/90 py-3" : "bg-black/40 py-6"}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-white">

                {/* MOBILE MENU */}
                <div className="md:hidden">
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="text-textSecondary hover:text-primary transition-colors">
                                <Menu size={24} />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-background border-r border-border w-full max-w-xs p-10 flex flex-col pt-20">
                            <SheetTitle className="hidden">Navigation Menu</SheetTitle>
                            <nav className="flex flex-col gap-8 text-lg tracking-wider uppercase font-medium">
                                {links.filter(l => l.is_active !== false).map((link) => (
                                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">
                                        {link.label}
                                    </Link>
                                ))}

                                <div className="mt-8 pt-8 border-t border-border">
                                    <Link href={user ? "/account" : "/login"} onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">
                                        {user ? "Account" : "Sign In"}
                                    </Link>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                <Link href="/" className="flex items-center group">
                    <img
                        src="/logo.jpg"
                        alt="DINA COSMETIC"
                        className={`transition-all duration-700 object-contain py-1 group-hover:scale-105
                            ${scrolled ? "h-8 md:h-10 lg:h-12" : "h-14 md:h-16 lg:h-20"}`}
                    />
                </Link>

                <nav className="hidden md:flex gap-10 text-[11px] tracking-[0.3em] uppercase font-bold">
                    {links.filter(l => l.is_active !== false).map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`transition-colors duration-300 relative group
                                ${pathname === link.href ? "text-gold" : "text-white/70 hover:text-white"}`}
                        >
                            {link.label}
                            <span className={`absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full
                                ${pathname === link.href ? "w-full" : ""}`} />
                        </Link>
                    ))}
                </nav>

                <div className="flex gap-8 items-center text-white/90">
                    <Link href={user ? "/account" : "/login"} className="hidden md:block hover:text-gold transition-colors">
                        <User size={20} strokeWidth={1.5} />
                    </Link>
                    <button onClick={() => setIsCartOpen(true)} className="hover:text-gold transition-colors relative group flex items-center gap-2">
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-black ring-2 ring-black">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>

            </div>
        </header>
    );
}
