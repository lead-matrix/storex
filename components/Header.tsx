"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";

export default function Header() {
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

    return (
        <header className="w-full bg-background border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

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
                                <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">Shop</Link>
                                <Link href="/collections" onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">Collections</Link>
                                <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">About</Link>
                                <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">Contact</Link>

                                <div className="mt-8 pt-8 border-t border-border">
                                    <Link href={user ? "/account" : "/login"} onClick={() => setIsMenuOpen(false)} className="text-textSecondary hover:text-primary transition">
                                        {user ? "Account" : "Sign In"}
                                    </Link>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                <Link href="/">
                    <h1 className="text-2xl font-playfair text-primary tracking-widest hidden md:block">
                        DINA COSMETIC
                    </h1>
                    <h1 className="text-xl font-playfair text-primary tracking-widest md:hidden">
                        DINA
                    </h1>
                </Link>

                <nav className="hidden md:flex gap-10 text-sm tracking-wider uppercase font-medium">
                    <Link href="/shop" className="text-textSecondary hover:text-primary transition">Shop</Link>
                    <Link href="/collections" className="text-textSecondary hover:text-primary transition">Collections</Link>
                    <Link href="/about" className="text-textSecondary hover:text-primary transition">About</Link>
                    <Link href="/contact" className="text-textSecondary hover:text-primary transition">Contact</Link>
                </nav>

                <div className="flex gap-5 items-center text-textSecondary">
                    <Link href={user ? "/account" : "/login"} className="hidden md:block hover:text-primary transition">
                        <User size={20} />
                    </Link>
                    <button onClick={() => setIsCartOpen(true)} className="hover:text-primary transition relative group flex items-center gap-2">
                        <ShoppingBag size={20} />
                        {totalItems > 0 && (
                            <span className="text-xs font-bold text-primary">{totalItems}</span>
                        )}
                    </button>
                </div>

            </div>
        </header>
    );
}
