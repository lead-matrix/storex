import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductActions } from "./ProductActions";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import Image from "next/image";

import { createClient as createPublicClient } from "@/lib/supabase/public";

export async function generateStaticParams() {
    const supabase = createPublicClient();
    if (!supabase) return [];

    const { data: products } = await supabase
        .from("products")
        .select("id");

    return products?.map((product) => ({
        id: product.id,
    })) || [];
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: product } = await supabase
        .from("products")
        .select("name, description")
        .eq("id", id)
        .single();

    if (!product) return { title: "Product Not Found" };

    return {
        title: `${product.name} | DINA COSMETIC`,
        description: product.description,
    };
}

export default async function ProductPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    let supabase;
    try {
        supabase = await createClient();
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        return notFound();
    }

    const { data: product, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('id', id)
        .single();

    if (error || !product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white pt-32 pb-16 px-6 animate-in fade-in duration-1000">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-white/40 hover:text-gold transition-colors pb-12 uppercase text-[10px] tracking-[0.4em]"
                >
                    <ArrowLeft className="w-3 h-3" />
                    The Collection
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    {/* Product Image Viewer */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/5] bg-neutral-900 rounded-none overflow-hidden border border-neutral-800 flex items-center justify-center group">
                            {product.images?.[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            ) : (
                                <div className="text-neutral-700 font-serif text-xl tracking-widest uppercase">
                                    Image Coming Soon
                                </div>
                            )}
                        </div>
                        {product.images?.slice(1).map((img: string, idx: number) => (
                            <div key={idx} className="relative aspect-[4/5] bg-neutral-900 overflow-hidden border border-neutral-800">
                                <Image src={img} alt={`${product.name} view ${idx + 2}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Product Information */}
                    <div className="flex flex-col space-y-12 lg:sticky lg:top-32 h-fit">
                        <div className="space-y-6">
                            <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-bold">LMT Elite Collection</h3>
                            <h1 className="text-6xl md:text-8xl font-serif uppercase tracking-tighter leading-none italic">{product.name}</h1>
                            <p className="text-[#D4AF37] text-4xl font-light tracking-widest font-serif">
                                ${Number(product.base_price).toFixed(2)}
                            </p>
                        </div>

                        <div className="h-px bg-gradient-to-r from-[#D4AF37] to-transparent w-full opacity-30"></div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-bold">The Essence</h3>
                            <p className="text-neutral-300 leading-relaxed text-lg font-light max-w-xl italic">
                                {product.description || "The quintessence of LMT minimalist luxury. This formula is crafted to enhance your natural radiance while providing the sophisticated touch your skin deserves."}
                            </p>
                        </div>

                        {/* Interactive Actions Component */}
                        <ProductActions product={product} variants={product.variants || []} />

                        <div className="mt-16 pt-10 border-t border-neutral-900 grid grid-cols-2 gap-10 text-[9px] text-neutral-500 tracking-[0.3em] uppercase font-light">
                            <div className="flex flex-col gap-3">
                                <span className="text-[#D4AF37] font-bold tracking-[0.4em]">Markets</span>
                                <span>Localized Fulfillment</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <span className="text-[#D4AF37] font-bold tracking-[0.4em]">Authenticity</span>
                                <span>Obsidian Palace Certified</span>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors pt-4">
                            <Share2 className="w-3 h-3" />
                            Share Masterpiece
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
