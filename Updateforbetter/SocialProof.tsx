"use client";

import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "Sarah M.",
    location: "New York, NY",
    rating: 5,
    text: "The quality is absolutely unmatched. I've tried every luxury brand and DINA COSMETIC stands out for lasting all day without feeling heavy. My go-to foundation now.",
    product: "Luminous Foundation",
    verified: true,
    initials: "SM",
    color: "#D4AF37",
  },
  {
    id: 2,
    name: "Amira K.",
    location: "Los Angeles, CA",
    rating: 5,
    text: "Honestly obsessed with the lipstick range. The pigmentation is incredible and it doesn't dry out my lips. Received so many compliments the first day I wore it.",
    product: "Velvet Lip Collection",
    verified: true,
    initials: "AK",
    color: "#C0392B",
  },
  {
    id: 3,
    name: "Priya R.",
    location: "Houston, TX",
    rating: 5,
    text: "Fast shipping, beautiful packaging, and the eyeshadow palette is stunning. The colors blend seamlessly and stay vibrant all day. Worth every penny.",
    product: "Obsidian Eye Palette",
    verified: true,
    initials: "PR",
    color: "#8E44AD",
  },
];

const PRESS_LOGOS = [
  { name: "Vogue", style: "font-serif italic text-2xl font-bold" },
  { name: "Harper's", style: "font-sans text-sm font-black uppercase tracking-widest" },
  { name: "Allure", style: "font-serif text-xl italic" },
  { name: "Cosmopolitan", style: "font-sans text-xs font-black uppercase tracking-[0.3em]" },
  { name: "Elle", style: "font-serif text-2xl font-bold italic" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Press logos */}
        <div className="text-center space-y-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#4A4A4A]/50 font-medium">As Featured In</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {PRESS_LOGOS.map((logo, i) => (
              <span key={i} className={`${logo.style} text-[#1A1A1A]/20 hover:text-[#1A1A1A]/50 transition-colors cursor-default`}>
                {logo.name}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#1A1A1A]/8" />
          <div className="flex items-center gap-2">
            <StarRating rating={5} />
            <span className="text-[12px] font-bold text-[#1A1A1A]">4.9/5</span>
            <span className="text-[11px] text-[#4A4A4A]/60">from 247 reviews</span>
          </div>
          <div className="flex-1 h-px bg-[#1A1A1A]/8" />
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-[#FAFAF8] border border-[#1A1A1A]/8 rounded-2xl p-6 space-y-4 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-[#D4AF37]/30" />

              {/* Review text */}
              <p className="text-sm text-[#4A4A4A] leading-relaxed">
                "{review.text}"
              </p>

              {/* Stars */}
              <StarRating rating={review.rating} />

              {/* Reviewer info */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#1A1A1A]/8">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ backgroundColor: review.color }}
                >
                  {review.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-[#1A1A1A]">{review.name}</p>
                    {review.verified && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#4A4A4A]/50">{review.product} · {review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
