"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-black pt-24 md:pt-0">

            {/* BACKGROUND ART */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(198,167,94,0.03)_0%,transparent_70%)] opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[60%] h-[60%] bg-gold/5 blur-[150px] rounded-full animate-pulse-slow" />
            </div>

            <div className="container-luxury grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10 py-16 md:py-24">

                {/* LEFT CONTENT */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:space-y-10 max-w-2xl mx-auto lg:mx-0 order-last lg:order-first animate-in fade-in slide-in-from-left-12 duration-1000 fill-mode-both">
                    <div className="space-y-4">
                        <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-medium opacity-90 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                            Obsidian Palace №1
                        </p>
                        <h1 className="text-5xl md:text-7xl lg:text-[90px] font-serif text-white uppercase leading-[1.1] md:leading-[1.0] font-light">
                            Pure <br className="hidden lg:block" />
                            <span className="text-gold italic block lg:inline-block">
                                Radiance
                            </span>
                        </h1>
                    </div>

                    <p className="text-[#b3b3b3] text-sm md:text-base font-light leading-relaxed max-w-lg opacity-80 animate-in fade-in duration-1000 delay-500">
                        The ultimate ritual in ultra-luxury cosmetics. Engineered for the flawless, the confident, and the eternal.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-700 w-full lg:w-auto">
                        <Link href="/shop" className="w-full sm:w-auto text-center bg-[#C6A75E] text-black px-10 py-4 uppercase text-[11px] tracking-[0.3em] font-medium transition-all duration-300 hover:bg-[#D4AF37] hover:shadow-[0_0_20px_rgba(198,167,94,0.3)]">
                            Discover
                        </Link>
                        <Link href="/about" className="group flex items-center justify-center gap-4 text-white text-[10px] uppercase tracking-[0.3em] border-b border-transparent hover:border-gold pb-1 transition-all duration-300">
                            The Heritage
                            <ArrowRight size={14} className="text-gold transition-all duration-300 group-hover:translate-x-2" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>

                {/* RIGHT IMAGE */}
                <div className="relative aspect-[3/4] md:aspect-square lg:aspect-[4/5] w-full max-w-xl mx-auto order-first lg:order-last animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
                    {/* ACCENT GLOW */}
                    <div className="absolute inset-0 bg-gold/5 blur-[80px] rounded-full z-0" />

                    <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5">
                        <Image
                            src="/hero_model_cosmetics_1772222351292.png"
                            alt="DINA COSMETIC Elegance"
                            fill
                            className="object-cover object-center grayscale-[0.2] hover:grayscale-0 transition-all duration-1000 scale-[1.02] hover:scale-100"
                            priority
                            sizes="(max-w-768px) 100vw, 50vw"
                        />
                    </div>

                    {/* FLOATING PRODUCT TAG */}
                    <div className="absolute bottom-8 -left-8 bg-[#0f0f0f]/90 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl hidden lg:block z-20 animate-in fade-in slide-in-from-left-10 duration-1000 delay-1000 fill-mode-both">
                        <div className="space-y-2 text-left">
                            <p className="text-gold text-[9px] uppercase tracking-widest font-medium">In Focus</p>
                            <h4 className="text-white text-base font-serif italic">Silk Foundation</h4>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

