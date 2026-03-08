"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Variant {
    id: string;
    title: string;
    price_override?: number | null;
    stock?: number;
}

interface Product {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    images: string[];
    description?: string;
    is_featured?: boolean;
}

interface BentoFeaturedGridProps {
    products: Product[];
}

function BentoCard({ product, featured = false, tall = false }: { product: Product & { variants?: Variant[] }; featured?: boolean; tall?: boolean }) {
    const { addToCart } = useCart();
    const [adding, setAdding] = useState(false);
    const mainImage = product.images?.[0] || "/logo.jpg";
    const firstVariant = product.variants?.[0];
    // Locked Pricing Logic: firstVariant?.price_override ?? product.base_price
    const price = firstVariant?.price_override ?? product.base_price ?? 0;

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        setAdding(true);
        addToCart({ id: firstVariant?.id || product.id, productId: product.id, name: product.title, price, image: mainImage, quantity: 1, variantName: firstVariant?.title });
        toast.success("Added to bag", { description: product.title });
        setTimeout(() => setAdding(false), 800);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full"
        >
            <Link href={`/product/${product.slug}`} id={`bento-${product.id}`}
                className={`group relative overflow-hidden glass gold-glow-hover flex flex-col h-full transition-all duration-500 ${tall ? "min-h-[500px]" : "min-h-[340px]"}`}>
                <div className={`relative overflow-hidden flex-shrink-0 ${tall ? "h-72" : "h-48"}`}>
                    <Image src={mainImage} alt={product.title} fill
                        className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {featured && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-[#D4AF37] text-black text-[8px] uppercase tracking-[0.4em] font-bold">Featured</div>
                    )}
                </div>
                <div className="flex flex-col flex-grow p-5 gap-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-white/90 text-base tracking-tight group-hover:text-[#D4AF37] transition-colors leading-snug">{product.title}</h3>
                        <span className="text-sm font-serif text-[#D4AF37] flex-shrink-0">${price.toFixed(2)}</span>
                    </div>
                    {product.description && (
                        <p className="text-[9px] text-white/30 uppercase tracking-widest leading-loose line-clamp-2">{product.description}</p>
                    )}
                    {product.variants && product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto">
                            {product.variants.slice(0, 3).map(v => (
                                <span key={v.id} className="px-2 py-0.5 border border-[#D4AF37]/15 text-[8px] uppercase tracking-widest text-white/35">{v.title}</span>
                            ))}
                            {product.variants.length > 3 && <span className="text-[8px] text-white/20 px-1">+{product.variants.length - 3}</span>}
                        </div>
                    )}
                    <button onClick={handleAdd} id={`bento-add-${product.id}`}
                        className="mt-auto flex items-center justify-center gap-2 w-full py-3 border border-[#D4AF37]/20 text-[9px] uppercase tracking-[0.35em] text-[#D4AF37]/65 hover:border-[#D4AF37]/55 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-300 min-h-[44px]">
                        <Plus className={`w-3 h-3 transition-transform duration-400 ${adding ? "rotate-90" : ""}`} />
                        {adding ? "Added" : "Quick Add"}
                    </button>
                </div>
            </Link>
        </motion.div>
    );
}

export function BentoFeaturedGrid({ products }: BentoFeaturedGridProps) {
    if (!products || products.length === 0) return null;

    const [hero, ...rest] = products as (Product & { variants?: Variant[] })[];
    const secondary = rest.slice(0, 2);
    const tertiary = rest.slice(2, 5);

    return (
        <section className="py-32 px-6 border-t border-[#D4AF37]/08">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.8 }} className="flex items-end justify-between mb-12">
                    <div>
                        <p className="text-[9px] uppercase tracking-[0.5em] text-[#D4AF37]/50 mb-3 font-light">Curated Vault</p>
                        <h2 className="text-2xl sm:text-3xl font-serif text-white/85 tracking-wide">Bestsellers</h2>
                    </div>
                    <Link href="/shop" id="bento-view-all"
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors min-h-[44px]">
                        View All <ArrowRight className="w-3 h-3" />
                    </Link>
                </motion.div>

                {/* Bento Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {hero && (
                        <div className="lg:col-span-8">
                            <BentoCard product={hero} featured tall />
                        </div>
                    )}
                    {secondary.length > 0 && (
                        <div className="lg:col-span-4 grid grid-rows-2 gap-4">
                            {secondary.map(p => <div key={p.id} className="min-h-[240px]"><BentoCard product={p} /></div>)}
                        </div>
                    )}
                    {tertiary.map(p => (
                        <div key={p.id} className="lg:col-span-4">
                            <BentoCard product={p} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
