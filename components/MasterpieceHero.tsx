"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";

const TRUST_STATS = [
    { value: "500+", label: "Luxury Products" },
    { value: "10k+", label: "Happy Clients" },
    { value: "Free", label: "Shipping $75+" },
];

export function MasterpieceHero() {
    const { setIsCartOpen } = useCart();
    void setIsCartOpen; // available for future use

    return (
        <section className="relative min-h-[90vh] w-full overflow-hidden bg-[#050505] flex items-center">

            {/* Atmospheric glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-[65vw] h-[65vh] rounded-full blur-[160px] bg-amber-900/15" />
                <div className="absolute top-1/3 left-1/4 w-[45vw] h-[45vw] rounded-full blur-[120px] bg-yellow-900/08 animate-pulse"
                    style={{ animationDuration: "8s" }} />
                <div className="absolute inset-y-0 left-0 w-1/2 hero-vignette-left" />
                <div className="absolute bottom-0 inset-x-0 h-48 hero-vignette-bottom" />
            </div>

            {/* Main layout */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[90vh] py-28 lg:py-0">

                {/* LEFT */}
                <div className="space-y-8">
                    <motion.span
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="block text-[10px] uppercase tracking-[0.45em] text-[#D4AF37]/70 font-light">
                        The Obsidian Palace Collection
                    </motion.span>

                    <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.1 }} className="space-y-1">
                        <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-serif text-white/95 leading-[1.02] tracking-tight">
                            Where Radiance
                        </h1>
                        <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-serif italic text-[#D4AF37] leading-[1.02] tracking-tight">
                            Meets Absolute Black
                        </h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }} className="origin-left">
                        <div className="flex items-center gap-4">
                            <div className="section-divider" />
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35 font-light">Elevate Your Beauty</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-wrap gap-4 pt-2">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Link href="/shop" id="hero-cta-shop"
                                className="flex items-center gap-3 bg-[#D4AF37] text-black px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-bold shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)] transition-all duration-400 min-h-[44px]">
                                Explore The Vault <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href="/collections" id="hero-cta-collections"
                                className="flex items-center gap-2 border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 text-[#D4AF37]/80 hover:text-[#D4AF37] px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-light transition-all duration-300 glass-sm min-h-[44px]">
                                View Collections
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }} className="flex items-center gap-6 pt-2">
                        {TRUST_STATS.map((stat, i) => (
                            <div key={i} className="flex items-center gap-6">
                                {i > 0 && <div className="w-px h-8 bg-white/10" />}
                                <div className="text-center">
                                    <div className="text-base font-serif text-[#D4AF37]">{stat.value}</div>
                                    <div className="text-[9px] uppercase tracking-widest text-white/30 mt-0.5">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* RIGHT */}
                <div className="relative h-[480px] lg:h-[600px] hidden lg:block">
                    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 w-60 h-[400px] animate-float">
                        <Image src="/logo.jpg" alt="Featured Product — Obsidian Core" fill className="object-contain filter-gold-glow" priority />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 0.85, x: 0 }}
                        transition={{ duration: 1, delay: 0.8 }} className="absolute left-12 top-16 w-32 h-32">
                        <Image src="/logo.jpg" alt="Product" fill className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 0.7, x: 0 }}
                        transition={{ duration: 1, delay: 1 }} className="absolute left-6 bottom-24 w-24 h-24">
                        <Image src="/logo.jpg" alt="Product" fill className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="absolute top-10 right-52 glass px-5 py-4 shadow-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span className="text-[8px] uppercase tracking-[0.4em] text-[#D4AF37]/80">Bestseller</span>
                        </div>
                        <div className="text-xs font-serif text-white/85">Obsidian Core</div>
                        <div className="text-base font-serif text-[#D4AF37] mt-0.5">$250</div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="absolute bottom-16 right-36 glass px-4 py-3 flex items-center gap-3">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[9px] uppercase tracking-wider text-white/55">New Arrivals Weekly</span>
                    </motion.div>

                    {/* Particle dots */}
                    {[
                        { top: "18%", right: "26%", size: "w-1.5 h-1.5", delay: "0.5s" } as React.CSSProperties & { size: string; delay: string },
                        { top: "42%", left: "40%", size: "w-1 h-1", delay: "1s" } as React.CSSProperties & { size: string; delay: string },
                        { bottom: "28%", right: "22%", size: "w-2 h-2", delay: "1.5s" } as React.CSSProperties & { size: string; delay: string },
                    ].map(({ size, delay, ...style }, i) => (
                        <div key={i} className={`absolute ${size} rounded-full bg-[#D4AF37]/45 animate-pulse`}
                            style={{ ...style, animationDelay: delay, animationDuration: "3s" }} />
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#D4AF37] animate-pulse" />
                <span className="text-[7px] uppercase tracking-[0.5em] text-[#D4AF37]">Scroll</span>
            </motion.div>
        </section>
    );
}
