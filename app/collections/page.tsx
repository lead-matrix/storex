import { ArrowRight, Box, Diamond, Crown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "Curated Collections | DINA COSMETIC",
    description: "Discover curated beauty sets and seasonal highlights from the Obsidian Palace.",
};

export default function CollectionsPage() {
    const collections = [
        {
            title: "Obsidian Core",
            subtitle: "The Foundation of Luxury",
            description: "Essential pieces formulated with absolute black minerals and liquid gold.",
            icon: <Box size={20} />,
            image: "/logo.jpg"
        },
        {
            title: "Royal Crimson",
            subtitle: "Limited Edition Lips",
            description: "Hand-crafted lip masterpieces for the inner circle.",
            icon: <Crown size={20} />,
            image: "/logo.jpg"
        },
        {
            title: "Palace Gold",
            subtitle: "The Highlight Series",
            description: "Refracted light captured in weighted artisan glass.",
            icon: <Diamond size={20} />,
            image: "/logo.jpg"
        }
    ];

    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen pt-32 pb-24">
            <div className="px-6 max-w-7xl mx-auto space-y-24">
                <div className="text-center space-y-6">
                    <h1 className="text-6xl md:text-9xl font-serif italic tracking-tighter uppercase text-text-headingDark">Vaults</h1>
                    <p className="text-gold-primary uppercase tracking-[0.5em] text-[10px] font-light max-w-md mx-auto">
                        Curated experiences extracted from the palace archives.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {collections.map((col, i) => (
                        <div key={i} className="group relative border border-gold-primary/5 bg-background-secondary p-12 space-y-12 hover:border-gold-primary/30 transition-all duration-700 overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <div className="text-gold-primary/50 group-hover:text-gold-primary transition-colors duration-500">
                                    {col.icon}
                                </div>
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark mb-2">{col.subtitle}</h3>
                                    <h2 className="text-3xl font-serif text-text-headingDark">{col.title}</h2>
                                </div>
                                <p className="text-xs text-text-mutedDark leading-loose uppercase tracking-widest font-light">
                                    {col.description}
                                </p>
                                <Link href="/shop" className="flex items-center gap-4 text-gold-primary uppercase text-[9px] tracking-[0.4em] pt-8 group-hover:translate-x-2 transition-transform duration-500">
                                    Access Vault <ArrowRight size={14} />
                                </Link>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
                                <Image src={col.image} alt="deco" fill className="object-contain" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
