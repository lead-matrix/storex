"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-[95vh] md:min-h-screen flex items-center overflow-hidden bg-black pt-20">

            {/* BACKGROUND ART */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(184,134,11,0.08)_0%,transparent_70%)] opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[60%] h-[60%] bg-gold/5 blur-[150px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent" />
            </div>

            <div className="container-luxury grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 py-16 md:py-0">

                {/* LEFT CONTENT */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-10 max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-left-12 duration-1000 fill-mode-both">
                    <div className="space-y-4">
                        <p className="text-gold text-[10px] md:text-[12px] uppercase tracking-[0.8em] font-bold opacity-80 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                            Obsidian Palace №1
                        </p>
                        <h1 className="text-6xl md:text-8xl lg:text-[100px] font-serif text-white leading-[0.9] tracking-tighter uppercase font-light">
                            Pure <br />
                            <span className="text-gold italic block md:inline lg:block transform lg:-translate-x-4 transition-transform duration-1000 delay-500">
                                Radiance
                            </span>
                        </h1>
                    </div>

                    <p className="text-luxury-subtext text-lg md:text-xl font-light leading-relaxed max-w-md opacity-70 animate-in fade-in duration-1000 delay-700">
                        The ultimate ritual in ultra-luxury cosmetics. Engineered for the flawless, the confident, and the eternal.
                    </p>

                    <div className="pt-6 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-1000">
                        <Link href="/shop" className="group flex items-center gap-6 text-white text-[12px] uppercase tracking-[0.4em] font-bold border-b border-gold/40 pb-2 hover:border-gold transition-all duration-500">
                            Discover the Collection
                            <ArrowRight size={20} className="text-gold transition-all duration-500 group-hover:translate-x-3" strokeWidth={1} />
                        </Link>
                    </div>
                </div>

                {/* RIGHT IMAGE */}
                <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
                    {/* DECORATIVE FRAME */}
                    <div className="absolute -inset-4 border border-white/5 rounded-3xl -z-10 translate-x-4 translate-y-4" />

                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent z-10 rounded-2xl" />
                    <Image
                        src="/hero_model_cosmetics_1772222351292.png"
                        alt="DINA COSMETIC Elegance"
                        fill
                        className="object-cover rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
                        priority
                        sizes="(max-w-768px) 100vw, 50vw"
                    />

                    {/* FLOATING PRODUCT TAG */}
                    <div className="absolute top-1/2 -left-12 bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-lg shadow-2xl hidden lg:block z-20 animate-in fade-in slide-in-from-left-10 duration-1000 delay-1500 fill-mode-both">
                        <div className="space-y-4 text-left">
                            <p className="text-gold text-[9px] uppercase tracking-widest font-bold">In Focus</p>
                            <h4 className="text-white text-lg font-serif italic">Silk Foundation</h4>
                            <div className="w-8 h-px bg-gold/30" />
                            <p className="text-luxury-subtext text-[10px] leading-relaxed">High-definition <br /> obsidian finish.</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* SCROLL INDICATOR */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-4 opacity-40 animate-bounce duration-[3000ms]">
                <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-gold">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
            </div>

        </section>
    );
}
