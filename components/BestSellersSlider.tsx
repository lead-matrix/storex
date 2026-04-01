'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface Product {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    sale_price?: number | null;
    on_sale?: boolean;
    is_bestseller?: boolean;
    is_new?: boolean;
    images: string[];
    description?: string;
    product_variants?: Array<{
        id: string;
        name: string;
        price_override?: number | null;
        stock?: number;
        status?: string;
    }>;
}

interface BestSellersSliderProps {
    products: Product[];
    heading?: string;
    subheading?: string;
}

export function BestSellersSlider({
    products,
    heading = 'The Obsidian Bestsellers',
    subheading = 'Most-loved by the Dina community',
}: BestSellersSliderProps) {
    const { addToCart } = useCart();
    const trackRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragScrollLeft, setDragScrollLeft] = useState(0);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // How many cards visible at once (responsive)
    const getVisibleCount = () => {
        if (typeof window === 'undefined') return 4;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 1024) return 2;
        if (window.innerWidth < 1280) return 3;
        return 4;
    };

    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        const update = () => setVisibleCount(getVisibleCount());
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const maxIndex = Math.max(0, products.length - visibleCount);

    const scrollToIndex = useCallback((idx: number) => {
        const clamped = Math.max(0, Math.min(idx, maxIndex));
        setCurrentIndex(clamped);
        if (!trackRef.current) return;
        const cardWidth = trackRef.current.scrollWidth / products.length;
        trackRef.current.scrollTo({ left: cardWidth * clamped, behavior: 'smooth' });
    }, [maxIndex, products.length]);

    const next = useCallback(() => {
        const nextIdx = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        scrollToIndex(nextIdx);
    }, [currentIndex, maxIndex, scrollToIndex]);

    const prev = useCallback(() => {
        const prevIdx = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        scrollToIndex(prevIdx);
    }, [currentIndex, maxIndex, scrollToIndex]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || products.length <= visibleCount) return;
        autoPlayRef.current = setInterval(next, 4000);
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [isAutoPlaying, next, products.length, visibleCount]);

    const pauseAutoPlay = () => {
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
    };

    // Drag to scroll
    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.pageX - (trackRef.current?.offsetLeft ?? 0));
        setDragScrollLeft(trackRef.current?.scrollLeft ?? 0);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !trackRef.current) return;
        e.preventDefault();
        const x = e.pageX - trackRef.current.offsetLeft;
        const walk = (x - dragStartX) * 1.5;
        trackRef.current.scrollLeft = dragScrollLeft - walk;
    };
    const stopDrag = () => setIsDragging(false);

    if (!products || products.length === 0) return null;

    return (
        <section
            className="bg-black pt-24 pb-32 relative overflow-hidden"
            onMouseEnter={pauseAutoPlay}
        >
            {/* Atmospheric glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="container-luxury mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 animate-in fade-in slide-in-from-left-5 duration-700">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                                ))}
                            </div>
                            <span className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">
                                {subheading}
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-wide font-light">
                            {heading.split(' ').map((word, i) =>
                                i === heading.split(' ').length - 1
                                    ? <em key={i} className="italic not-italic">{word}</em>
                                    : <span key={i}>{word} </span>
                            )}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/bestsellers"
                            className="text-[10px] uppercase tracking-[0.3em] text-gold/70 hover:text-gold border-b border-gold/20 hover:border-gold/60 pb-1 transition-all hidden md:flex items-center gap-2"
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Nav arrows */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { prev(); pauseAutoPlay(); }}
                                className="w-10 h-10 border border-white/10 hover:border-gold/50 bg-black/40 hover:bg-gold/10 flex items-center justify-center transition-all group"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-4 h-4 text-white/50 group-hover:text-gold transition-colors" />
                            </button>
                            <button
                                onClick={() => { next(); pauseAutoPlay(); }}
                                className="w-10 h-10 border border-white/10 hover:border-gold/50 bg-black/40 hover:bg-gold/10 flex items-center justify-center transition-all group"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-gold transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Track */}
                <div
                    ref={trackRef}
                    className={`flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-16 xl:px-[max(2rem,calc((100vw-1280px)/2+2rem))] select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={stopDrag}
                    onMouseLeave={stopDrag}
                >
                    {products.map((product, idx) => {
                        const activeVariants = (product.product_variants || []).filter(v => v.status !== 'draft');
                        const image = product.images?.[0] || '/logo.jpg';
                        const isOnSale = product.on_sale && product.sale_price;
                        const price = isOnSale ? Number(product.sale_price) : Number(product.base_price);
                        const originalPrice = Number(product.base_price);

                        const handleAdd = (e: React.MouseEvent) => {
                            e.preventDefault();
                            if (activeVariants.length > 0) {
                                window.location.href = `/product/${product.slug}`;
                                return;
                            }
                            addToCart({
                                id: product.id,
                                productId: product.id,
                                name: product.title,
                                price,
                                image,
                                quantity: 1,
                            });
                        };

                        return (
                            <div
                                key={product.id}
                                className="flex-none w-[calc(100vw-3rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] group"
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                <div className="bg-[#0A0A0C] border border-white/5 hover:border-gold/25 transition-all duration-500 overflow-hidden h-full flex flex-col">
                                    {/* Image */}
                                    <Link href={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden flex-shrink-0">
                                        <Image
                                            src={image}
                                            alt={product.title}
                                            fill
                                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                                            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                        />
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                            {product.is_bestseller && (
                                                <span className="bg-gold text-black text-[8px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase">
                                                    Bestseller
                                                </span>
                                            )}
                                            {isOnSale && (
                                                <span className="bg-red-600 text-white text-[8px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase">
                                                    Sale
                                                </span>
                                            )}
                                            {product.is_new && (
                                                <span className="bg-white text-black text-[8px] font-bold tracking-[0.2em] px-2.5 py-1 uppercase">
                                                    New
                                                </span>
                                            )}
                                        </div>

                                        {/* Rank */}
                                        <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                                            <span className="text-gold text-[10px] font-bold font-mono">{String(idx + 1).padStart(2, '0')}</span>
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="p-5 flex flex-col flex-1 gap-3">
                                        <Link href={`/product/${product.slug}`}>
                                            <h3 className="font-serif text-white text-base leading-snug group-hover:text-gold/90 transition-colors line-clamp-2">
                                                {product.title}
                                            </h3>
                                        </Link>

                                        {product.description && (
                                            <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2 flex-1">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                {isOnSale ? (
                                                    <>
                                                        <span className="text-gold font-semibold">${price.toFixed(2)}</span>
                                                        <span className="text-white/30 text-xs line-through">${originalPrice.toFixed(2)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gold font-semibold">${price.toFixed(2)}</span>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleAdd}
                                                className="text-[9px] uppercase tracking-widest border border-gold/30 hover:border-gold hover:bg-gold/10 text-gold px-3 py-2 transition-all duration-300"
                                            >
                                                {activeVariants.length > 0 ? 'Select' : '+ Add'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dots */}
                {products.length > visibleCount && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { scrollToIndex(idx); pauseAutoPlay(); }}
                                className={`transition-all duration-500 rounded-full ${idx === currentIndex ? 'w-8 h-1 bg-gold' : 'w-1 h-1 bg-white/20 hover:bg-white/40'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Mobile: View all link */}
                <div className="flex justify-center mt-10 md:hidden">
                    <Link
                        href="/bestsellers"
                        className="text-[10px] uppercase tracking-[0.3em] text-gold border border-gold/30 px-8 py-4 hover:bg-gold/10 transition-all"
                    >
                        View All Bestsellers
                    </Link>
                </div>
            </div>
        </section>
    );
}
