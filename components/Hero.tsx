"use client";

import { useCart } from "@/context/CartContext";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function Hero() {
    return (
        <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gold/5 z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 blur-[120px] rounded-full z-0 animate-pulse" />

            <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="space-y-2">
                    <p className="text-gold uppercase tracking-[0.5em] text-[10px] md:text-xs font-light">
                        Luxury Skin & Color
                    </p>
                    <h1 className="text-6xl md:text-9xl font-serif text-white tracking-tighter leading-none">
                        DINA <br className="md:hidden" /> COSMETIC
                    </h1>
                </div>

                <div className="w-16 h-px bg-gold/50 mx-auto" />

                <p className="text-white/60 text-sm md:text-lg max-w-xl mx-auto font-light leading-relaxed uppercase tracking-widest">
                    The Obsidian Palace Collection. <br />
                    Where Radiance Meets Absolute Black.
                </p>

                <div className="pt-8">
                    <button
                        onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative flex items-center gap-4 border border-gold/40 px-12 py-5 text-gold hover:border-gold transition-all duration-700 uppercase text-xs tracking-[0.4em] overflow-hidden"
                    >
                        <span className="relative z-10">Explore The Vault</span>
                        <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                        <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                            Check Products <ArrowRight className="w-4 h-4 ml-4" />
                        </span>
                    </button>
                </div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-gold/20" />
            </div>
        </section>
    );
}
