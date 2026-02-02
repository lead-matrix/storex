"use client";

import Link from "next/link";
import { ShoppingBag, User, Search, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Navbar() {
    const { totalItems, setIsCartOpen } = useCart();

    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button className="md:hidden text-white hover:text-gold transition-colors">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-light">
                    <Link href="/shop" className="text-white/70 hover:text-gold transition-colors">Shop</Link>
                    <Link href="/collections" className="text-white/70 hover:text-gold transition-colors">Collections</Link>
                    <Link href="/about" className="text-white/70 hover:text-gold transition-colors">The Palace</Link>
                </div>
            </div>

            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-contain" />
                </div>
                <span className="hidden md:block font-serif text-lg tracking-widest text-white">DINA COSMETIC</span>
            </Link>

            <div className="flex items-center gap-4">
                <button className="text-white/70 hover:text-gold transition-colors">
                    <Search className="w-5 h-5" />
                </button>
                <Link href="/admin" className="text-white/70 hover:text-gold transition-colors">
                    <User className="w-5 h-5" />
                </Link>
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative text-white/70 hover:text-gold transition-colors"
                >
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-gold text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>
        </nav>
    );
}
