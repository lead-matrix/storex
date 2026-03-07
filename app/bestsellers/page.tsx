import { ProductGrid } from "@/components/ProductGrid";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Bestsellers | DINA COSMETIC",
    description: "The most coveted artifacts from the Obsidian Palace.",
};

export default function BestsellersPage() {
    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury space-y-20">

                {/* HEADER / BESTSELLERS SECTION */}
                <section className="py-32 bg-background text-textPrimary tracking-[0.1em]">
                    <div className="max-w-5xl mx-auto px-6 text-center">

                        <p className="text-sm tracking-[0.3em] text-[#D4AF37] uppercase mb-6 font-bold">
                            ✦ THE INNER CIRCLE
                        </p>

                        <h2 className="text-5xl md:text-6xl font-playfair italic mb-8 tracking-[0.1em] text-white">
                            Bestsellers
                        </h2>

                        <p className="text-lg text-textSecondary leading-relaxed max-w-2xl mx-auto tracking-[0.1em]">
                            The most coveted artifacts chosen by our community. Absolute excellence at its peak.
                        </p>

                    </div>
                </section>

                {/* FILTERS */}
                <div className="flex justify-center gap-10 border-b border-border pb-6 tracking-[0.1em]">
                    <Link
                        href="/shop"
                        className={`text-xs uppercase transition-all duration-300 pb-1 border-b-2 text-textSecondary border-transparent hover:text-textPrimary`}
                    >
                        Back to Full Boutique
                    </Link>
                </div>

                {/* GRID - Filter overridden to 'bestsellers' */}
                <div className="min-h-[400px]">
                    <ProductGrid filter="bestsellers" />
                </div>

            </div>
        </div>
    );
}
