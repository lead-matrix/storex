import { ProductGrid } from "@/components/ProductGrid";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Exclusive Offers | DINA COSMETIC",
    description: "Discover our limited time sale offers.",
};

export default function SalePage() {
    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury space-y-16">
                {/* HEADER SECTION */}
                <section className="py-24 bg-background text-textPrimary tracking-[0.1em]">
                    <div className="max-w-5xl mx-auto px-6 text-center">
                        <p className="text-xs tracking-[0.4em] text-red-500 uppercase mb-6 font-bold">
                            ✦ Limited Time Offers ✦
                        </p>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-playfair italic mb-8 tracking-[0.1em]">
                            The Sale Collection
                        </h2>

                        <p className="text-sm md:text-base text-textSecondary leading-relaxed max-w-2xl mx-auto tracking-[0.1em]">
                            Exclusive pricing on our masterpieces. Complete your dark aesthetic ritual before these offers vanish.
                        </p>
                    </div>
                </section>

                {/* PRODUCT GRID - passing filter "sale" to fetch only sale items */}
                <div className="min-h-[400px]">
                    <ProductGrid filter="sale" />
                </div>
            </div>
        </div>
    );
}
