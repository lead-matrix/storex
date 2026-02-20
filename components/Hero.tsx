"use client";

import { useCart } from "@/context/CartContext";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function Hero() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [heroData, setHeroData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchHeroData = async () => {
            const { data } = await supabase
                .from('pages')
                .select('content')
                .eq('slug', 'home')
                .single();
            if (data?.content?.hero) {
                setHeroData(data.content.hero);
            }
        };
        fetchHeroData();
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

    return (
        <>
            <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-gold/5 z-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 blur-[120px] rounded-full z-0 animate-pulse" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <div className="space-y-4">
                        <p className="text-gold uppercase tracking-[0.5em] text-[10px] md:text-xs font-light">
                            {heroData?.subtitle || "Luxury Skin & Color"}
                        </p>
                        <h1 className="text-6xl md:text-9xl font-serif text-white tracking-tighter leading-tight">
                            {heroData?.title?.split(' ').map((word: string, i: number) => (
                                <span key={i} className="block md:inline mr-4 last:mr-0">{word}</span>
                            )) || "DINA COSMETIC"}
                        </h1>
                    </div>

                    <div className="w-16 h-px bg-gold/50 mx-auto" />

                    <p className="text-white/60 text-sm md:text-lg max-w-xl mx-auto font-light leading-relaxed uppercase tracking-widest">
                        The Obsidian Palace Collection. <br />
                        Where Radiance Meets Absolute Black.
                    </p>

                    <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group relative flex items-center gap-4 border border-gold/40 px-12 py-5 text-gold hover:border-gold transition-all duration-700 uppercase text-xs tracking-[0.4em] overflow-hidden min-w-[280px]"
                        >
                            <span className="relative z-10">{heroData?.cta_text || "Explore The Vault"}</span>
                            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                            <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                                View Collection <ArrowRight className="w-4 h-4 ml-4" />
                            </span>
                        </button>

                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-3 px-12 py-5 text-white/40 hover:text-gold transition-colors uppercase text-[10px] tracking-[0.4em]"
                        >
                            <Search className="w-4 h-4" />
                            Search Archives
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-gold/20" />
                </div>
            </section>

            {/* Global Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
                    <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute top-10 right-10 text-white/40 hover:text-gold transition-colors"
                    >
                        <X size={32} />
                    </button>

                    <div className="max-w-3xl mx-auto mt-40 px-6 space-y-12">
                        <div className="space-y-4">
                            <p className="text-gold uppercase tracking-[0.5em] text-[10px]">What do you seek?</p>
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="SEARCH THE PALACE COLLECTION..."
                                className="w-full bg-transparent border-b border-gold/20 py-6 text-2xl md:text-5xl font-serif text-white outline-none focus:border-gold transition-colors placeholder:text-zinc-800"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {searchResults.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/shop/${product.id}`}
                                    onClick={() => setIsSearchOpen(false)}
                                    className="flex items-center gap-6 p-4 border border-white/5 hover:border-gold/20 bg-zinc-950/50 transition-all group"
                                >
                                    <div className="w-16 h-16 bg-zinc-900 relative flex-shrink-0">
                                        <Image src={product.images?.[0] || "/logo.jpg"} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-sm font-serif text-white group-hover:text-gold transition-colors">{product.name}</h3>
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{product.category}</p>
                                    </div>
                                    <span className="text-xs text-zinc-400 font-serif whitespace-nowrap">${Number(product.base_price).toFixed(2)}</span>
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
