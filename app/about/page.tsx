import { createClient } from "@/lib/supabase/server";
import { Sparkles, ShieldCheck, History, Heart } from "lucide-react";
import Image from "next/image";

export const metadata = {
    title: "The Palace | DINA COSMETIC",
    description: "The story and philosophy of the Obsidian Palace, where luxury meets absolute black.",
};

export default function AboutPage() {
    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen pt-32 pb-24 overflow-hidden">
            {/* Hero Section */}
            <div className="px-6 max-w-7xl mx-auto space-y-24 mb-32">
                <div className="text-center space-y-8 animate-in fade-in slide-in-from-top-12 duration-1000">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-24 h-24 opacity-80">
                            <Image src="/logo.jpg" alt="Palace Sigil" fill className="object-contain" />
                        </div>
                    </div>
                    <p className="text-gold-primary uppercase tracking-[0.5em] text-[10px] md:text-xs font-light">
                        Our Genesis
                    </p>
                    <h1 className="text-6xl md:text-9xl font-serif italic tracking-tighter uppercase leading-[0.8] text-text-headingDark">
                        The Obsidian <br /> Palace
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative aspect-[3/4] bg-background-secondary border border-gold-primary/10 overflow-hidden group">
                        <Image
                            src="https://zsahskxejgbrvfhobfyp.supabase.co/storage/v1/object/public/product-images/dina-owner.png"
                            alt="Dina, Founder of DINA COSMETIC"
                            fill
                            className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background-primary to-transparent opacity-80" />
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-gold-primary font-serif text-3xl italic">A Vision of Elegance</h2>
                            <p className="text-text-mutedDark text-[11px] md:text-sm uppercase tracking-[0.2em] leading-relaxed font-light">
                                Dina, the visionary founder of DINA COSMETIC, established this brand with a steadfast commitment to professional-grade beauty and uncompromising luxury. With deep industry expertise, Dina has crafted formulations that go beyond aesthetics, prioritizing skin health, performance, and purity.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-gold-primary font-serif text-3xl italic">Earned Devotion</h2>
                            <p className="text-text-mutedDark text-[11px] md:text-sm uppercase tracking-[0.2em] leading-relaxed font-light">
                                Trusted by thousands of women worldwide, our collections have become a staple in the routines of those who demand excellence. Every artifact produced under the Obsidian Standard undergoes rigorous testing, ensuring that you receive unparalleled luxury and flawless results.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Philosophy Grid */}
            <div className="bg-background-secondary/50 border-y border-gold-primary/5 py-32 mt-32">
                <div className="px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <PhilosophyPoint
                            icon={<History className="text-gold-primary" size={20} />}
                            title="Legacy"
                            text="Evolving the timeless secrets of cosmetics into modern artifacts."
                        />
                        <PhilosophyPoint
                            icon={<ShieldCheck className="text-gold-primary" size={20} />}
                            title="Purity"
                            text="Untouched by ordinary standards. Crafted for the absolute."
                        />
                        <PhilosophyPoint
                            icon={<Sparkles className="text-gold-primary" size={20} />}
                            title="Radiance"
                            text="Designed to capture and reflect light in its most premium form."
                        />
                        <PhilosophyPoint
                            icon={<Heart className="text-gold-primary" size={20} />}
                            title="Devotion"
                            text="A singular focus on the enhancement of your natural majesty."
                        />
                    </div>
                </div>
            </div>

            {/* Final Call to Order */}
            <div className="py-40 text-center px-6">
                <h2 className="text-2xl md:text-4xl font-serif italic text-text-headingDark/40 max-w-2xl mx-auto leading-relaxed">
                    "Step out of the ordinary and into the sanctuary of your own excellence."
                </h2>
                <div className="mt-12">
                    <div className="w-px h-24 bg-gold-primary/30 mx-auto" />
                    <p className="mt-8 text-[9px] uppercase tracking-[0.5em] text-gold-primary font-bold italic">
                        The Ritual Awaits
                    </p>
                </div>
            </div>
        </div>
    );
}

function PhilosophyPoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
    return (
        <div className="space-y-6 group">
            <div className="w-12 h-12 flex items-center justify-center border border-gold-primary/10 bg-background-primary group-hover:border-gold-primary/40 transition-all duration-500">
                {icon}
            </div>
            <h3 className="text-xs uppercase tracking-[0.4em] text-text-headingDark font-bold">{title}</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark leading-loose">
                {text}
            </p>
        </div>
    );
}

