"use client"

import { ProductGrid } from "@/components/ProductGrid"
import { motion } from "framer-motion"

interface ProductGridSectionProps {
    category?: string
    limit?: number
}

export default function ProductGridSection({ category, limit }: ProductGridSectionProps) {
    return (
        <section className="py-24 px-6 md:px-12 bg-obsidian">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-px h-6 bg-gold" />
                            <span className="text-[10px] uppercase tracking-luxury font-bold text-gold">Curated Collection</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight uppercase">Manifest Your Essence</h2>
                    </div>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.4em] max-w-xs leading-relaxed">
                        Hand-selected artifacts from our latest alchemy batches. Available for a limited chronological window.
                    </p>
                </div>

                <ProductGrid categoryId={category === "all" ? undefined : category} />
            </div>
        </section>
    )
}
