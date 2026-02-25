"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Static hero — no DB dependency (data comes from page / server component)
export function Hero() {
    const { setIsCartOpen } = useCart();

    return (
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0a0800]">

            {/* ── Atmospheric background glows ── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Deep amber glow bottom-right */}
                <div className="absolute bottom-0 right-0 w-[70vw] h-[70vh] bg-amber-900/20 blur-[140px] rounded-full" />
                {/* Subtle gold center pulse */}
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[40vw] h-[40vw] bg-yellow-900/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
                {/* Dark vignette edges */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0800] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0800] via-transparent to-[#0a0800]/60" />
            </div>

            {/* ── Layout ── */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center py-24 lg:py-0 min-h-[92vh]">

                {/* LEFT — Text content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">

                    {/* Eyebrow */}
                    <p className="text-[10px] uppercase tracking-[0.5em] text-amber-500/70 font-light">
                        The Obsidian Palace · 2026
                    </p>

                    {/* H1 */}
                    <div className="space-y-1">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-white/95 leading-[1.05] tracking-tight">
                            Where Radiance
                        </h1>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif italic text-amber-400 leading-[1.05] tracking-tight">
                            Meets Absolute Black
                        </h1>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-px bg-amber-500/40" />
                        <p className="text-sm text-white/40 font-light tracking-widest uppercase">Elevate Your Beauty</p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link
                            href="/shop"
                            className="group flex items-center gap-3 bg-amber-500/90 hover:bg-amber-400 text-black px-8 py-3.5 text-[11px] uppercase tracking-[0.3em] font-semibold transition-all duration-300 shadow-[0_0_30px_rgba(251,191,36,0.25)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)]"
                        >
                            Shop Now
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/collections"
                            className="flex items-center gap-2 border border-amber-500/30 hover:border-amber-400/60 text-amber-400/80 hover:text-amber-300 px-8 py-3.5 text-[11px] uppercase tracking-[0.3em] font-light transition-all duration-300 backdrop-blur-sm"
                        >
                            Explore Collections
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="text-center">
                            <div className="text-lg font-serif text-amber-400">500+</div>
                            <div className="text-[9px] uppercase tracking-widest text-white/30">Luxury Products</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <div className="text-lg font-serif text-amber-400">10k+</div>
                            <div className="text-[9px] uppercase tracking-widest text-white/30">Happy Clients</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <div className="text-lg font-serif text-amber-400">Free</div>
                            <div className="text-[9px] uppercase tracking-widest text-white/30">Shipping $75+</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Product imagery collage */}
                <div className="relative h-[480px] lg:h-[600px] animate-in fade-in slide-in-from-right-8 duration-700 delay-200">

                    {/* Main hero bottle — large, center-right */}
                    <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-44 sm:w-56 lg:w-64 h-72 sm:h-96 lg:h-[420px] drop-shadow-[0_20px_60px_rgba(251,191,36,0.3)]">
                        <Image
                            src="/logo.jpg"
                            alt="Hero Product"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Secondary product — top left of cluster */}
                    <div className="absolute left-8 lg:left-16 top-12 w-28 sm:w-36 h-28 sm:h-36 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)] opacity-90">
                        <Image
                            src="/logo.jpg"
                            alt="Product"
                            fill
                            className="object-contain"
                        />
                    </div>

                    {/* Third product — bottom left */}
                    <div className="absolute left-4 lg:left-10 bottom-16 w-24 sm:w-32 h-24 sm:h-32 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)] opacity-80">
                        <Image
                            src="/logo.jpg"
                            alt="Product"
                            fill
                            className="object-contain"
                        />
                    </div>

                    {/* Gold particle dots */}
                    <div className="absolute top-20 right-32 w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-40 left-36 w-1 h-1 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-32 right-24 w-2 h-2 rounded-full bg-amber-500/30 animate-pulse" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-32 right-16 w-1 h-1 rounded-full bg-amber-300/50 animate-pulse" style={{ animationDelay: '2s' }} />

                    {/* Floating product card */}
                    <div className="absolute top-8 right-8 lg:right-48 bg-black/60 backdrop-blur-sm border border-amber-500/20 px-4 py-3 shadow-xl">
                        <div className="text-[9px] uppercase tracking-widest text-amber-400/70">Bestseller</div>
                        <div className="text-xs font-serif text-white/80 mt-0.5">Obsidian Core</div>
                        <div className="text-sm font-serif text-amber-400 mt-1">$250</div>
                    </div>

                    {/* Bottom floating badge */}
                    <div className="absolute bottom-8 right-8 lg:right-32 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-amber-500/15 px-4 py-2.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] uppercase tracking-wider text-white/60">New Arrivals Weekly</span>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
                <div className="w-px h-12 bg-gradient-to-b from-transparent to-amber-400 animate-pulse" />
                <span className="text-[8px] uppercase tracking-[0.4em] text-amber-400">Scroll</span>
            </div>
        </section>
    );
}
