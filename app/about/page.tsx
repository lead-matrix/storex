import { createClient } from "@/lib/supabase/server";
import { Sparkles, ShieldCheck, History, Heart } from "lucide-react";
import Image from "next/image";

export const metadata = {
    title: "The Palace | DINA COSMETIC",
    description: "The story and philosophy of the Obsidian Palace, where luxury meets absolute black.",
};

export default function AboutPage() {
    return (
        <div className="bg-black text-white min-h-screen pt-32 pb-24 overflow-hidden font-inter">
            {/* Meet The Founder Section */}
            <div className="px-6 max-w-7xl mx-auto mb-32 relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
                    <div className="space-y-10 order-2 lg:order-1">
                        <div>
                            <p className="text-gold uppercase tracking-[0.3em] text-xs font-semibold mb-4">
                                MEET THE FOUNDER
                            </p>
                            <h1 className="text-4xl md:text-5xl font-serif text-white mb-8">
                                Dina Edouarin Pierre
                            </h1>
                            <div className="w-16 h-px bg-gold border-0 mb-8" />
                        </div>

                        <div className="space-y-6 text-luxury-subtext text-sm md:text-base leading-relaxed font-light">
                            <p>
                                Dina Edouarin Pierre is the visionary behind Dina Cosmetic, a beauty brand created to inspire confidence and elegance in women everywhere.
                            </p>
                            <p>
                                With a passion for beauty, fashion, and creativity, Dina built Dina Cosmetic to provide high-quality makeup products designed for every skin tone and every occasion.
                            </p>
                            <p className="text-gold italic font-serif text-lg">
                                "Her goal is simple: to help women feel powerful, confident, and beautiful in their own skin."
                            </p>
                        </div>

                        {/* Mission */}
                        <div className="pt-12 border-t border-white/10">
                            <p className="text-gold uppercase tracking-[0.3em] text-xs font-semibold mb-8">
                                OUR MISSION
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="flex items-start gap-4 group">
                                    <div className="text-gold mt-1 group-hover:scale-110 transition-transform"><Heart size={20} strokeWidth={1.5} /></div>
                                    <div>
                                        <p className="text-white text-sm font-medium mb-1">Inclusive Beauty</p>
                                        <p className="text-luxury-subtext text-xs">for All Skin Tones</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group">
                                    <div className="text-gold mt-1 group-hover:scale-110 transition-transform"><Sparkles size={20} strokeWidth={1.5} /></div>
                                    <div>
                                        <p className="text-white text-sm font-medium mb-1">High-Quality</p>
                                        <p className="text-luxury-subtext text-xs">Cosmetic Formulas</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group sm:col-span-2">
                                    <div className="text-gold mt-1 group-hover:scale-110 transition-transform"><ShieldCheck size={20} strokeWidth={1.5} /></div>
                                    <div>
                                        <p className="text-white text-sm font-medium mb-1">Confidence Through Beauty</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="relative aspect-[3/4] rounded-sm overflow-hidden border border-white/10 group">
                            <Image
                                src="/products/Banner-1.jpg" // Using one of the new local banners that might feature a model
                                alt="Founder Dina Edouarin Pierre"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        </div>
                    </div>
                </div>
            </div>

            {/* A Growing Beauty Community Section */}
            <div className="relative border-y border-gold/20 bg-gradient-to-b from-black via-[#0a0a0a] to-black py-24 object-cover">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

                <div className="px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div>
                            <div className="relative aspect-[4/3] rounded-sm overflow-hidden border border-white/10 group">
                                <Image
                                    src="/products/banner-3.jfif" // Lifestyle/community shot
                                    alt="Dina Cosmetic Community"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-gold uppercase tracking-[0.3em] text-xs font-semibold mb-6">
                                A GROWING BEAUTY COMMUNITY
                            </h2>
                            <div className="space-y-6 text-luxury-subtext text-sm md:text-base leading-relaxed font-light">
                                <p>
                                    Dina Cosmetic continues to grow through community events, beauty showcases, and collaborations.
                                </p>
                                <p>
                                    Our brand connects with beauty lovers, makeup artists, and entrepreneurs who share a passion for creativity and self-expression.
                                </p>
                            </div>

                            <div className="pt-8">
                                <a href="/shop" className="inline-block px-10 py-4 border border-gold text-gold text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-black transition-colors duration-300">
                                    Shop Collection
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
            </div>
        </div>
    );
}

