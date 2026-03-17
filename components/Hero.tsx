"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Slide {
    id: string | number;
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
}

const DEFAULT_SLIDES: Slide[] = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=2000&auto=format&fit=crop",
        title: "THE OBSIDIAN COLLECTION",
        subtitle: "ELEVATE YOUR BEAUTY RITUAL.",
        buttonText: "SHOP NOW",
        link: "/collections"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=2000&auto=format&fit=crop",
        title: "FLAWLESS FINISH",
        subtitle: "Discover the foundation of elegance.",
        buttonText: "SHOP NOW",
        link: "/collections"
    },
];

export function Hero() {
    const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSlides = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('frontend_content')
                .select('content_data')
                .eq('content_key', 'hero_slides')
                .maybeSingle();

            if (data?.content_data?.slides) {
                setSlides(data.content_data.slides);
            }
            setLoading(false);
        };

        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (loading) {
        return <div className="w-full h-[100svh] bg-black animate-pulse" />;
    }

    return (
        <section className="relative w-full h-[calc(100svh-6rem)] md:h-[calc(100svh-8rem)] lg:h-[calc(100svh-9rem)] xl:h-[calc(100svh-10rem)] mt-[6rem] md:mt-[8rem] lg:mt-[9rem] xl:mt-[10rem] min-h-[500px] overflow-hidden bg-black">
            {slides.map((slide, index) => (
                <div
                    key={slide.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                    <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover object-center"
                        priority={index === 0}
                        quality={90}
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-playfair text-primary tracking-[0.15em] uppercase mb-4 drop-shadow-md">
                            {slide.title}
                        </h2>
                        <p className="text-base md:text-xl text-white/90 font-light tracking-widest max-w-2xl mx-auto mb-10 drop-shadow-sm">
                            {slide.subtitle}
                        </p>
                        <Link
                            href={slide.link}
                            className="inline-block px-10 py-4 bg-primary text-black text-sm font-semibold tracking-[0.2em] uppercase hover:bg-[#b08d2d] transition-colors rounded-sm"
                        >
                            {slide.buttonText}
                        </Link>
                    </div>
                </div>
            ))}

            {slides.length > 1 && (
                <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-primary scale-110 shadow-[0_0_10px_rgba(212,175,55,0.8)]" : "bg-white/30 hover:bg-white/50"}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

