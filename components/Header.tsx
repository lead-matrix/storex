"use client";

import Link from "next/link";
import { ShoppingBag, User, Search, Menu, X, Instagram, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
    const { totalItems, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [headerData, setHeaderData] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const fetchHeaderData = async () => {
            const { data } = await supabase
                .from('frontend_content')
                .select('content_data')
                .eq('content_key', 'header_main')
                .single();
            if (data) setHeaderData(data.content_data);
        };
        fetchHeaderData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (searchQuery.length > 2) {
                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .ilike('name', `%${searchQuery}%`)
                    .limit(5);
                setSearchResults(data || []);
            } else {
                setSearchResults([]);
            }
        };
        fetchResults();
    }, [searchQuery]);

    const NavLinks = () => {
        const links = headerData?.navigation || [
            { label: "Shop", href: "/shop" },
            { label: "Collections", href: "/collections" },
            { label: "The Palace", href: "/about" }
        ];

        return (
            <>
                {links.map((link: any, i: number) => (
                    <Link
                        key={i}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="hover:text-gold-primary transition-colors text-text-bodyDark/70 py-2"
                    >
                        {link.label}
                    </Link>
                ))}
            </>
        );
    };

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-background-primary/80 backdrop-blur-xl border-b border-gold-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Mobile Menu Trigger */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <button className="md:hidden text-text-headingDark hover:text-gold-primary transition-colors p-2 -ml-2">
                                <Menu className="w-5 h-5" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-background-primary border-r border-gold-primary/20 w-full p-0 flex flex-col">
                            <div className="p-8 border-b border-gold-primary/10 flex flex-col items-center gap-4">
                                <div className="relative w-12 h-12">
                                    <Image src={headerData?.logo?.url || "/logo.jpg"} alt="Logo" fill className="object-contain" />
                                </div>
                                <SheetTitle className="font-serif text-2xl tracking-[0.2em] text-text-headingDark">
                                    {headerData?.logo?.alt || "DINA COSMETIC"}
                                </SheetTitle>
                                <p className="text-[9px] uppercase tracking-[0.4em] text-gold-primary/60 font-light">The Obsidian Palace</p>
                            </div>

                            <div className="flex-grow flex flex-col justify-center gap-8 py-12 text-sm uppercase tracking-[0.5em] font-light text-center px-8">
                                <NavLinks />
                                <div className="h-px bg-gold/10 w-12 mx-auto my-4" />
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-gold-accent/40 hover:text-gold-primary transition-colors py-2 flex items-center justify-center gap-3"
                                >
                                    <User size={14} />
                                    Admin Vault
                                </Link>
                            </div>

                            <div className="p-8 border-t border-gold-primary/10 bg-background-secondary/50 space-y-8">
                                <div className="flex justify-center gap-8 text-white/30">
                                    <Instagram size={20} className="hover:text-gold-primary transition-colors" />
                                    <span className="text-[10px] uppercase tracking-widest self-center">@dinacosmetic</span>
                                </div>
                                <Link
                                    href="/shop"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full border border-gold-accent/40 py-4 flex items-center justify-center gap-4 text-gold-primary uppercase text-[10px] tracking-[0.3em]"
                                >
                                    Quick Shop <ArrowRight size={14} />
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-light">
                        <NavLinks />
                    </div>
                </div>

                <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <Image src={headerData?.logo?.url || "/logo.jpg"} alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="hidden lg:block font-serif text-lg tracking-widest text-text-headingDark uppercase">
                        {headerData?.logo?.alt || "DINA COSMETIC"}
                    </span>
                </Link>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="text-text-bodyDark/70 hover:text-gold-primary transition-colors p-2"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <Link href={user ? "/account" : "/login"} className="hidden sm:block text-text-bodyDark/70 hover:text-gold-primary transition-colors p-2" title={user ? "My Account" : "Sign In"}>
                        <User className="w-5 h-5" />
                    </Link>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative text-text-bodyDark/70 hover:text-gold-primary transition-colors p-2"
                        aria-label="Shopping Bag"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {totalItems > 0 && (
                            <span className="absolute top-1 right-1 bg-gold-primary text-background-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Global Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-background-primary/95 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto">
                    <button
                        onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                        }}
                        className="fixed top-6 right-6 md:top-10 md:right-10 text-text-mutedDark hover:text-gold-primary transition-colors z-[110]"
                    >
                        <X size={32} />
                    </button>

                    <div className="max-w-3xl mx-auto mt-24 md:mt-40 px-6 space-y-12 pb-20">
                        <div className="space-y-4">
                            <p className="text-gold-primary uppercase tracking-[0.5em] text-[10px]">What do you seek?</p>
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="SEARCH ARCHIVES..."
                                className="w-full bg-transparent border-b border-gold-primary/20 py-4 md:py-6 text-xl md:text-5xl font-serif text-text-headingDark outline-none focus:border-gold-primary transition-colors placeholder:text-text-mutedDark/20"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {searchResults.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/shop/${product.id}`}
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="flex items-center gap-4 md:gap-6 p-3 md:p-4 border border-white/5 hover:border-gold-primary/20 bg-background-secondary/50 transition-all group"
                                >
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-900 relative flex-shrink-0">
                                        <Image src={product.images?.[0] || "/logo.jpg"} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xs md:text-sm font-serif text-text-headingDark group-hover:text-gold-primary transition-colors line-clamp-1">{product.name}</h3>
                                        <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-500">{product.category}</p>
                                    </div>
                                    <span className="text-[10px] md:text-xs text-zinc-400 font-serif whitespace-nowrap">${Number(product.base_price).toFixed(2)}</span>
                                </Link>
                            ))}
                            {searchQuery.length > 2 && searchResults.length === 0 && (
                                <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] py-12 text-center italic">No artifacts found in the archives</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
