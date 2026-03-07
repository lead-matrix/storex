import { ProductGrid } from "@/components/ProductGrid";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Sale | DINA COSMETIC",
    description: "Exclusive markdowns and limited-time offers from the Obsidian Palace.",
};

export default function SalePage() {
    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury space-y-20">

                {/* HEADER / SALE SECTION */}
                <section className="py-32 bg-background text-textPrimary tracking-[0.1em]">
                    <div className="max-w-5xl mx-auto px-6 text-center">

                        <p className="text-sm tracking-[0.3em] text-red-500 uppercase mb-6 font-bold">
                            ✦ EXCLUSIVE OFFERS
                        </p>

                        <h2 className="text-5xl md:text-6xl font-playfair italic mb-8 tracking-[0.1em] text-[#D4AF37]">
                            The Masterpiece Event
                        </h2>

                        <p className="text-lg text-textSecondary leading-relaxed max-w-2xl mx-auto tracking-[0.1em]">
                            Limited-time markdowns on selected artifacts from the Obsidian Palace. Absolute excellence at an unprecedented value.
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

                {/* GRID - Filter overridden to 'sale' */}
                <div className="min-h-[400px]">
                    <ProductGrid filter="sale" />
                </div>

            </div>
        </div>
    );
}
