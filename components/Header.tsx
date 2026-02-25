"use client";

import Link from "next/link";
import { ShoppingBag, User, Search, Menu, X, Instagram, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const NAV_LINKS = [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "The Palace", href: "/about" },
];

export default function Header() {
    const { totalItems, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{
        id: string; name: string; images: string[]; price: number; slug: string;
    }[]>([]);
    const supabase = createClient();
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const [scrolled, setScrolled] = useState(false);

    // Auth listener
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

    // Scroll shadow
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Live search
    useEffect(() => {
        if (searchQuery.length < 3) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from("products")
                .select("id, name, images, price, slug")
                .ilike("name", `%${searchQuery}%`)
                .eq("is_active", true)
                .limit(6);
            setSearchResults(data || []);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <>
            {/* ── Main Navbar ─────────────────────────────────────────── */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300
                bg-background-primary/90 backdrop-blur-xl border-b border-gold-primary/10
                ${scrolled ? "shadow-[0_2px_24px_rgba(0,0,0,0.4)]" : ""}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

                    {/* LEFT — Mobile hamburger + Desktop nav links */}
                    <div className="flex items-center gap-6">
                        {/* Mobile hamburger */}
                        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                            <SheetTrigger asChild>
                                <button className="md:hidden text-text-headingDark hover:text-gold-primary transition-colors p-1 -ml-1" aria-label="Menu">
                                    <Menu className="w-5 h-5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-background-primary border-r border-gold-primary/20 w-72 p-0 flex flex-col">
                                {/* Mobile menu header */}
                                <div className="p-8 border-b border-gold-primary/10 flex flex-col items-center gap-3">
                                    <div className="relative w-12 h-12">
                                        <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain" />
                                    </div>
                                    <SheetTitle className="font-serif text-xl tracking-[0.2em] text-text-headingDark">
                                        DINA COSMETIC
                                    </SheetTitle>
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-gold-primary/60 font-light">The Obsidian Palace</p>
                                </div>
                                {/* Mobile nav links */}
                                <nav className="flex-grow flex flex-col justify-center py-12 px-8 space-y-6">
                                    {NAV_LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-sm uppercase tracking-[0.4em] font-light text-text-bodyDark/80 hover:text-gold-primary transition-colors py-1"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-gold-primary/10 my-2" />
                                    <Link
                                        href="/account"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-sm uppercase tracking-[0.4em] font-light text-text-bodyDark/40 hover:text-gold-primary transition-colors py-1 flex items-center gap-3"
                                    >
                                        <User size={14} />
                                        {user ? "My Account" : "Sign In"}
                                    </Link>
                                </nav>
                                {/* Mobile CTA */}
                                <div className="p-6 border-t border-gold-primary/10">
                                    <Link
                                        href="/shop"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center justify-center gap-3 border border-gold-primary/40 py-3 text-gold-primary uppercase text-[10px] tracking-[0.3em] hover:bg-gold-primary/5 transition-colors"
                                    >
                                        Shop All <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-8">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-[10px] uppercase tracking-[0.25em] font-light text-text-bodyDark/70 hover:text-gold-primary transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-primary group-hover:w-full transition-all duration-300" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* CENTER — Logo */}
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 group">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                                src="/logo.jpg"
                                alt="DINA COSMETIC Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="hidden lg:block font-serif text-base tracking-[0.3em] text-text-headingDark uppercase group-hover:text-gold-primary transition-colors">
                            DINA COSMETIC
                        </span>
                    </Link>

                    {/* RIGHT — Search, Login, Cart */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="text-text-bodyDark/60 hover:text-gold-primary transition-colors p-2 rounded-sm"
                            aria-label="Search"
                        >
                            <Search className="w-[18px] h-[18px]" />
                        </button>

                        {/* Account */}
                        <Link
                            href={user ? "/account" : "/login"}
                            className="hidden sm:flex text-text-bodyDark/60 hover:text-gold-primary transition-colors p-2 rounded-sm"
                            title={user ? "My Account" : "Sign In"}
                            aria-label={user ? "My Account" : "Sign In"}
                        >
                            <User className="w-[18px] h-[18px]" />
                        </Link>

                        {/* Shopping Bag */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative text-text-bodyDark/60 hover:text-gold-primary transition-colors p-2 rounded-sm"
                            aria-label="Shopping Bag"
                        >
                            <ShoppingBag className="w-[18px] h-[18px]" />
                            {totalItems > 0 && (
                                <span className="absolute top-1 right-1 bg-gold-primary text-background-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                                    {totalItems > 9 ? "9+" : totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Search Overlay ──────────────────────────────────────── */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-background-primary/97 backdrop-blur-xl animate-in fade-in duration-200">
                    <button
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                        className="absolute top-6 right-6 text-text-mutedDark hover:text-gold-primary transition-colors"
                        aria-label="Close search"
                    >
                        <X size={24} />
                    </button>

                    <div className="max-w-2xl mx-auto pt-32 px-6 space-y-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.5em] text-gold-primary mb-4">Search</p>
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full bg-transparent border-b-2 border-gold-primary/20 focus:border-gold-primary pb-4 text-3xl font-serif text-text-headingDark outline-none placeholder:text-text-mutedDark/20 transition-colors"
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="space-y-2">
                                {searchResults.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                                        className="flex items-center gap-4 p-3 border border-gold-primary/5 hover:border-gold-primary/20 bg-background-secondary/30 hover:bg-background-secondary/60 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-background-secondary relative flex-shrink-0 overflow-hidden">
                                            <Image src={product.images?.[0] || "/logo.jpg"} alt={product.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-serif text-text-headingDark group-hover:text-gold-primary transition-colors truncate">{product.name}</p>
                                        </div>
                                        <span className="text-xs text-gold-primary font-light flex-shrink-0">${Number(product.price).toFixed(2)}</span>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {searchQuery.length > 2 && searchResults.length === 0 && (
                            <p className="text-[10px] uppercase tracking-widest text-text-mutedDark/30 text-center py-8">
                                No products found for &ldquo;{searchQuery}&rdquo;
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
