"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";

export default function Header({ navItems = [] }: { navItems?: { label: string, href: string, is_active?: boolean }[] }) {
    const { totalItems, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const links = navItems.length > 0 ? navItems : [
        { label: 'Shop', href: '/shop' },
        { label: 'Collections', href: '/collections' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' }
    ];

    return (
        <header className="w-full fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 transition-colors duration-500 hover:bg-black/90">
            <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center text-white">

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

                <Link href="/" className="flex items-center">
                    <img src="/logo.jpg" alt="DINA COSMETIC" className="h-8 md:h-20 lg:h-24 w-auto object-contain py-2" />
                </Link>

                <nav className="hidden md:flex gap-10 text-sm tracking-widest uppercase font-medium">
                    {links.filter(l => l.is_active !== false).map((link) => (
                        <Link key={link.href} href={link.href} className="text-white/80 hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex gap-6 items-center text-white/90">
                    <Link href={user ? "/account" : "/login"} className="hidden md:block hover:text-primary transition-colors">
                        <User size={22} strokeWidth={1.5} />
                    </Link>
                    <button onClick={() => setIsCartOpen(true)} className="hover:text-primary transition-colors relative group flex items-center gap-2">
                        <ShoppingBag size={22} strokeWidth={1.5} />
                        {totalItems > 0 && (
                            <span className="text-xs font-bold text-primary">{totalItems}</span>
                        )}
                    </button>
                </div>

            </div>
        </header>
    );
}
