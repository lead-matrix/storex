"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag } from "lucide-react";
import { useState, useEffect } from "react";

interface Product {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    sale_price: number | null;
    images: string[];
    description: string;
}

export function SaleHeroSlider({ products, mode = 'sale' }: { products: Product[], mode?: 'sale' | 'bestseller' }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (products.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [products.length]);

    if (!products || products.length === 0) {
        return (
            <section className="relative min-h-[100svh] w-full bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="text-white/50 text-sm tracking-[0.3em] uppercase">No active sales at the moment</div>
                    <Link href="/shop" className="text-gold text-xs tracking-widest uppercase border-b border-gold/30 hover:border-gold pb-1 transition-colors">
                        Explore Our Full Collection
                    </Link>
                </div>
            </section>
        );
    }

    const currentProduct = products[currentIndex];
    const image = currentProduct.images?.[0] || "/placeholder.jpg";

    return (
        <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#050505] flex items-center">
            {/* Background Images */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentProduct.id}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="relative h-full w-full"
                    >
                        <Image
                            src={image}
                            alt={currentProduct.title}
                            fill
                            className="object-cover object-center grayscale-[0.2] brightness-75"
                            priority
                            quality={90}
                            sizes="100vw"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Atmospheric glows */}
            <div className="absolute inset-0 pointer-events-none z-1">
                <div className="absolute bottom-0 right-0 w-[65vw] h-[65vh] rounded-full blur-[160px] bg-gold/10" />
                <div className="absolute top-1/3 left-1/4 w-[45vw] h-[45vw] rounded-full blur-[120px] bg-amber-900/05 animate-pulse"
                    style={{ animationDuration: "8s" }} />
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>

            {/* Main layout */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:py-28 flex flex-col items-center justify-center text-center">
                <div className="space-y-10 max-w-5xl w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${currentIndex}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            <motion.span
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className={`inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.55em] font-bold whitespace-nowrap px-4 py-2 rounded-full border ${mode === 'sale' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-gold bg-gold/10 border-gold/20'}`}
                            >
                                <Tag className="w-3.5 h-3.5" /> {mode === 'sale' ? 'Featured Sale' : 'Bestseller'}
                            </motion.span>

                            <div className="space-y-4">
                                <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-serif text-white leading-[1.1] tracking-tight max-w-5xl mx-auto drop-shadow-lg">
                                    {currentProduct.title}
                                </h1>
                                <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-white/60 font-light max-w-2xl mx-auto line-clamp-2">
                                    {currentProduct.description || "Indulge in absolute luxury."}
                                </p>
                            </div>
                            
                            {/* Pricing */}
                            <div className="flex items-center justify-center gap-4 text-xl">
                                {mode === 'sale' ? (
                                    <>
                                        <span className="text-white/40 line-through decoration-gold/50">${currentProduct.base_price?.toFixed(2)}</span>
                                        <span className="text-gold font-bold text-3xl">${currentProduct.sale_price?.toFixed(2)}</span>
                                    </>
                                ) : (
                                    <span className="text-white font-bold text-3xl">${currentProduct.base_price?.toFixed(2)}</span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href={`/product/${currentProduct.slug}`} 
                                        className="flex items-center gap-3 bg-gold text-black px-12 py-5 text-[11px] uppercase tracking-[0.35em] font-bold shadow-[0_0_50px_rgba(212,175,55,0.25)] hover:shadow-[0_0_70px_rgba(212,175,55,0.45)] transition-all duration-400">
                                        Shop This Item <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href="/sale"
                                        className="flex items-center gap-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/5 text-red-400 hover:text-red-300 px-12 py-5 text-[11px] uppercase tracking-[0.35em] font-bold transition-all duration-300 backdrop-blur-sm">
                                        View All Sale Items
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                {products.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-500 rounded-full 
                            ${idx === currentIndex ? 'w-8 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
            
            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-10 right-10 flex flex-col items-center gap-3 pointer-events-none hidden md:flex">
                <div className="w-px h-14 bg-gradient-to-b from-white/0 via-gold/60 to-white/0" />
                <span className="text-[8px] uppercase tracking-[0.6em] text-gold/80 italic">Scroll</span>
            </motion.div>
        </section>
    );
}
