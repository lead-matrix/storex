"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Collection {
    id: string;
    name: string;
    slug: string | null;
    description?: string | null;
    image_url?: string | null;
    product_count?: number;
}

interface CollectionShowcaseProps {
    collections: Collection[];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export function CollectionShowcase({ collections }: CollectionShowcaseProps) {
    if (!collections || collections.length === 0) return null;

    return (
        <section className="py-28 px-6 border-t border-[#D4AF37]/08">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-4 mb-20"
                >
                    <p className="text-[9px] uppercase tracking-[0.6em] text-[#D4AF37]/50 font-light">Palace Archives</p>
                    <h2 className="text-4xl md:text-5xl font-serif italic text-white/85 tracking-tight">
                        The Collections
                    </h2>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="w-12 h-px bg-[#D4AF37]/30" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
                        <div className="w-12 h-px bg-[#D4AF37]/30" />
                    </div>
                </motion.div>

                {/* Showcase horizontal scroll on mobile, grid on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {collections.map((col, i) => {
                        const href = col.slug ? `/collections/${col.slug}` : "/shop";
                        return (
                            <motion.div
                                key={col.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.7, delay: i * 0.08 }}
                            >
                                <Link
                                    href={href}
                                    id={`collection-${col.slug || col.id}`}
                                    className="group relative glass gold-glow-hover block overflow-hidden transition-all duration-700 min-h-[320px]"
                                >
                                    {/* Background image if exists */}
                                    {col.image_url ? (
                                        <div className="absolute inset-0">
                                            <Image
                                                src={col.image_url}
                                                alt={col.name}
                                                fill
                                                className="object-cover object-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0800]/80 to-[#050505]/95" />
                                    )}

                                    {/* Roman numeral watermark */}
                                    <div className="absolute top-5 right-6 text-[52px] font-serif text-[#D4AF37]/04 group-hover:text-[#D4AF37]/08 transition-colors duration-700 select-none pointer-events-none">
                                        {ROMAN[i] || (i + 1).toString()}
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 p-8 space-y-5 h-full flex flex-col justify-between min-h-[320px]">
                                        <div className="space-y-4">
                                            {/* Gold accent line */}
                                            <div className="w-5 h-px bg-[#D4AF37]/35 group-hover:w-10 transition-all duration-500" />

                                            <div>
                                                <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 mb-2.5 font-light">
                                                    {col.product_count ? `${col.product_count} pieces` : "Curated Experience"}
                                                </p>
                                                <h3 className="text-2xl font-serif text-white/90 tracking-tight group-hover:text-[#D4AF37] transition-colors duration-400">
                                                    {col.name}
                                                </h3>
                                            </div>

                                            {col.description && (
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-loose font-light line-clamp-3">
                                                    {col.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="flex items-center gap-3 text-[#D4AF37] uppercase text-[9px] tracking-[0.4em] group-hover:gap-5 transition-all duration-500">
                                            Explore Vault
                                            <ArrowRight size={11} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* View all */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-center mt-16"
                >
                    <Link
                        href="/collections"
                        id="collection-showcase-view-all"
                        className="inline-flex items-center gap-3 border border-[#D4AF37]/25 text-[#D4AF37]/75 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 px-10 py-4 text-[10px] uppercase tracking-[0.4em] transition-all duration-400 glass-sm min-h-[44px]"
                    >
                        The Full Boutique <ArrowRight size={12} />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
