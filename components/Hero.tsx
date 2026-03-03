"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const slides = [
    {
        id: 1,
        image: "https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/slide-1.png",
        title: "DINA COSMETIC",
        subtitle: "ELEVATE YOUR BEAUTY RITUAL",
        buttonText: "SHOP THE LOOK",
        link: "/shop"
    },
    {
        id: 2,
        image: "https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/slide-2.png",
        title: "THE BEAUTY DIALOGUE",
        subtitle: "Step into the Spotlight: An Exclusive Talk on Elegance and Glamour.",
        buttonText: "WATCH EPISODE",
        link: "/blog"
    },
    {
        id: 3,
        image: "https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/slide-3.png",
        title: "THE EXCLUSIVE APPAREL",
        subtitle: "Premium custom-printed streetwear with exquisite gold detailing.",
        buttonText: "SHOP APPAREL",
        link: "/shop?category=apparel"
    },
    {
        id: 4,
        image: "https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/slide-4.png",
        title: "THE BEAUTY BLOG",
        subtitle: "Mastering the Golden Hour Glow: A Guide to Radiant Skin.",
        buttonText: "READ MORE",
        link: "/blog"
    }
];

export function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-black">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                    <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover object-center"
                        priority={index === 0}
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-playfair text-primary tracking-[0.15em] uppercase mb-4 drop-shadow-md transform transition-all duration-700 translate-y-0 opacity-100">
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

            {/* Slide Indicators */}
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
        </section>
    );
}

