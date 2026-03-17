"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Slide {
    id: string | number;
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
    badge?: string;
}

const DEFAULT_SLIDES: Slide[] = [
    {
        id: "default-1",
        image: "",
        title: "Where Radiance Meets Absolute Black",
        subtitle: "The Obsidian Palace Collection",
        badge: "Limited Edition Release",
        buttonText: "Explore The Vault",
        link: "/shop",
    },
];

const TRUST_STATS = [
    { value: "500+", label: "Luxury Products" },
    { value: "10k+", label: "Happy Clients" },
    { value: "Free", label: "Shipping $75+" },
];

export function MasterpieceHero({ initialSlides }: { initialSlides?: Slide[] }) {
    const [slides, setSlides] = useState<Slide[]>(initialSlides || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(!initialSlides);

    useEffect(() => {
        if (initialSlides) {
            setSlides(initialSlides);
            setLoading(false);
            return;
        }

        const fetchSlides = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('frontend_content')
                .select('content_data')
                .eq('content_key', 'hero_slides')
                .maybeSingle();

            if (data?.content_data?.slides && Array.isArray(data.content_data.slides)) {
                setSlides(data.content_data.slides);
            } else {
                setSlides(DEFAULT_SLIDES);
            }
            setLoading(false);
        };

        fetchSlides();
    }, [initialSlides]);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (loading && !initialSlides) {
        return <div className="w-full h-[90vh] bg-[#050505] animate-luxury-pulse" />;
    }

    const currentSlide = slides[currentIndex] || DEFAULT_SLIDES[0];

    return (
        <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#050505] flex items-center">
            {/* Background Images with AnimatePresence for smooth transitions */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide.id || currentIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="relative h-full w-full"
                    >
                        {currentSlide.image && (
                            <Image
                                src={currentSlide.image}
                                alt={currentSlide.title}
                                fill
                                className="object-cover object-center grayscale-[0.2] brightness-75"
                                priority
                                quality={90}
                                sizes="100vw"
                            />
                        )}
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
                                className="block text-[10px] sm:text-[11px] uppercase tracking-[0.55em] text-gold/80 font-medium whitespace-nowrap"
                            >
                                {currentSlide.badge || "Exclusive Collection"}
                            </motion.span>

                            <div className="space-y-4">
                                <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-serif text-white leading-[1.1] tracking-tight max-w-5xl mx-auto">
                                    {currentSlide.title}
                                </h1>
                                <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-white/40 font-light max-w-2xl mx-auto italic">
                                    {currentSlide.subtitle}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href={currentSlide.link || "/shop"} id="hero-cta-main"
                                        className="flex items-center gap-3 bg-gold text-black px-12 py-5 text-[11px] uppercase tracking-[0.35em] font-bold shadow-[0_0_50px_rgba(212,175,55,0.25)] hover:shadow-[0_0_70px_rgba(212,175,55,0.45)] transition-all duration-400">
                                        {currentSlide.buttonText || "Shop Now"} <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link href="/collections" id="hero-cta-secondary"
                                        className="flex items-center gap-2 border border-white/10 hover:border-gold/40 text-white/60 hover:text-white px-12 py-5 text-[11px] uppercase tracking-[0.35em] font-light transition-all duration-300 backdrop-blur-sm">
                                        View Collections
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="flex items-center justify-center gap-8 sm:gap-20 pt-16 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 scrollbar-hide"
                    >
                        {TRUST_STATS.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className="text-xl sm:text-2xl font-serif text-gold tracking-wider">{stat.value}</div>
                                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/20 font-light">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Floating particles decor */}
            <div className="absolute inset-0 pointer-events-none hidden lg:block opacity-40">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "easeInOut"
                        }}
                        className="absolute w-1 h-1 bg-gold/40 rounded-full"
                        style={{
                            left: `${10 + i * 15}%`,
                            top: `${30 + i * 10}%`
                        }}
                    />
                ))}
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-px h-14 bg-gradient-to-b from-white/0 via-gold/60 to-white/0" />
                <span className="text-[8px] uppercase tracking-[0.6em] text-gold/80 italic">The Ritual</span>
            </motion.div>
        </section>
    );
}
