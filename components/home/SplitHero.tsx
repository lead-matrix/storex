"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeroSlide {
  id: string | number;
  image: string;
  badge?: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  link: string;
  rating?: number;
  reviewCount?: number;
}

const DEFAULT_SLIDE: HeroSlide = {
  id: "default",
  image: "/logo.jpg",
  badge: "New Collection",
  title: "DINA COSMETIC",
  subtitle: "Crafted for those who demand absolute excellence",
  description: "Premium beauty formulations born from the finest ingredients. Elevate your ritual.",
  buttonText: "Shop Collection",
  link: "/shop",
  rating: 4.9,
  reviewCount: 247,
};

export default function SplitHero() {
  const [slides, setSlides] = useState<HeroSlide[]>([DEFAULT_SLIDE]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("frontend_content")
      .select("content_data")
      .eq("content_key", "hero_slides")
      .maybeSingle()
      .then(({ data }) => {
        const customSlides = (data as any)?.content_data?.slides;
        if (Array.isArray(customSlides) && customSlides.length > 0) {
          setSlides(customSlides);
        }
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % slides.length);
      setImageLoaded(false);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentIndex] || DEFAULT_SLIDE;

  return (
    <section className="relative w-full min-h-[90vh] bg-[#FAFAF8] overflow-hidden mt-16 md:mt-20 lg:mt-24">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212,175,55,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212,175,55,0.05) 0%, transparent 40%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 h-full min-h-[90vh] flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-12 lg:py-0">

        {/* LEFT — Product Image */}
        <div className="relative w-full lg:w-1/2 flex items-center justify-center order-2 lg:order-1">
          <div className="relative w-full max-w-sm lg:max-w-none aspect-[3/4] lg:aspect-[4/5]">
            {/* Decorative circle behind image */}
            <div className="absolute inset-8 rounded-full bg-[#F0E8D8]/60" />

            {/* Product image */}
            <div className={`relative w-full h-full transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}>
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-contain object-center drop-shadow-2xl"
                priority
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 1024px) 80vw, 45vw"
              />
            </div>

            {/* Floating badge */}
            {slide.rating && (
              <div className="absolute top-4 right-4 lg:top-8 lg:right-0 bg-white shadow-lg rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i <= Math.floor(slide.rating!) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-200 fill-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-[#1A1A1A]">{slide.rating}</span>
                <span className="text-[10px] text-gray-400">({slide.reviewCount})</span>
              </div>
            )}

            {/* Bottom floating card */}
            <div className="absolute -bottom-4 left-4 lg:-left-8 bg-white shadow-xl rounded-2xl px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <span className="text-sm">✨</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wide">Bestseller</p>
                <p className="text-[10px] text-gray-400">{slide.badge || "New Arrival"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Copy */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 order-1 lg:order-2 text-center lg:text-left">

          {/* Badge */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="h-px w-8 bg-[#D4AF37]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
              {slide.badge || "Premium Beauty"}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#1A1A1A] leading-[1.05] tracking-tight">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed max-w-md mx-auto lg:mx-0">
            {slide.description || slide.subtitle}
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mt-2">
            <Link
              href={slide.link}
              className="group flex items-center gap-3 bg-[#1A1A1A] text-white px-8 py-4 text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-[#D4AF37] transition-all duration-300 w-full sm:w-auto justify-center"
            >
              {slide.buttonText}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/collections"
              className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] border-b-2 border-[#D4AF37] pb-0.5 hover:text-[#D4AF37] transition-colors"
            >
              View All Collections
            </Link>
          </div>

          {/* Trust mini-stats */}
          <div className="flex items-center gap-6 justify-center lg:justify-start pt-4 border-t border-[#1A1A1A]/10">
            {[
              { value: "500+", label: "Products" },
              { value: "10k+", label: "Happy Clients" },
              { value: "4.9★", label: "Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-[#1A1A1A]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A]/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 h-2 bg-[#D4AF37]" : "w-2 h-2 bg-[#1A1A1A]/20"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
