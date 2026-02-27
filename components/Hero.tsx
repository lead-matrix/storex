"use client";

import Link from "next/link";

export function Hero() {
    return (
        <section className="bg-background text-textPrimary py-32 tracking-[0.1em]">
            <div className="max-w-7xl mx-auto px-6 text-center space-y-8">

                <h2 className="text-5xl md:text-6xl font-playfair tracking-[0.15em] uppercase">
                    Elevate Your Beauty Ritual
                </h2>

                <p className="text-lg text-textSecondary max-w-2xl mx-auto tracking-[0.1em]">
                    Premium cosmetics crafted for elegance, confidence, and timeless beauty.
                </p>

                <Link
                    href="/shop"
                    className="inline-block px-10 py-4 bg-primary text-black font-semibold tracking-widest uppercase hover:opacity-90 transition rounded-none"
                >
                    Shop Collection
                </Link>
            </div>
        </section>
    );
}

