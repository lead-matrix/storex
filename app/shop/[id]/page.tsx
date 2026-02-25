import { createClient } from "@/utils/supabase/server";
import { createClient as createPublicClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductActions } from "./ProductActions";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";

export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
    const supabase = createPublicClient();
    const { data: products } = await supabase
        .from("products")
        .select("id");

    return products?.map((product: { id: string }) => ({
        id: product.id,
    })) || [];
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

    // Access cookies to ensure request-time context
    await cookies();

    const supabase = await createClient();

    const { data: product, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('id', id)
        .single();

    if (error || !product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background-primary text-text-bodyDark pt-32 pb-16 px-6 animate-in fade-in duration-1000">
            <div className="max-w-7xl mx-auto">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-text-mutedDark hover:text-gold-primary transition-colors pb-12 uppercase text-[10px] tracking-[0.4em]"
                >
                    <ArrowLeft className="w-3 h-3" />
                    The Collection
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    {/* Product Image Viewer */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/5] bg-background-secondary rounded-none overflow-hidden border border-gold-primary/10 flex items-center justify-center group">
                            {product.images?.[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            ) : (
                                <div className="text-text-mutedDark font-serif text-xl tracking-widest uppercase">
                                    Image Coming Soon
                                </div>
                            )}
                        </div>
                        {product.images?.slice(1).map((img: string, idx: number) => (
                            <div key={idx} className="relative aspect-[4/5] bg-background-secondary overflow-hidden border border-gold-primary/10">
                                <Image src={img} alt={`${product.name} view ${idx + 2}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>

                    {/* Product Information */}
                    <div className="flex flex-col space-y-12 lg:sticky lg:top-32 h-fit">
                        <div className="space-y-6">
                            <h3 className="text-gold-primary text-[10px] uppercase tracking-[0.5em] font-bold">LMT Elite Collection</h3>
                            <h1 className="text-6xl md:text-8xl font-serif uppercase tracking-tighter leading-none italic text-text-headingDark">{product.name}</h1>
                            <p className="text-gold-primary text-4xl font-light tracking-widest font-serif">
                                ${Number(product.price).toFixed(2)}
                            </p>
                        </div>

                        <div className="h-px bg-gradient-to-r from-gold-primary to-transparent w-full opacity-30"></div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark font-bold">The Essence</h3>
                            <p className="text-text-bodyDark/80 leading-relaxed text-lg font-light max-w-xl italic">
                                {product.description || "The quintessence of LMT minimalist luxury. This formula is crafted to enhance your natural radiance while providing the sophisticated touch your skin deserves."}
                            </p>
                        </div>

                        {/* Interactive Actions Component */}
                        <ProductActions product={product} variants={product.variants || []} />

                        <div className="mt-16 pt-10 border-t border-gold-primary/10 grid grid-cols-2 gap-10 text-[9px] text-text-mutedDark tracking-[0.3em] uppercase font-light">
                            <div className="flex flex-col gap-3">
                                <span className="text-gold-primary font-bold tracking-[0.4em]">Markets</span>
                                <span>Localized Fulfillment</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <span className="text-gold-primary font-bold tracking-[0.4em]">Authenticity</span>
                                <span>Obsidian Palace Certified</span>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/40 hover:text-text-headingDark transition-colors pt-4">
                            <Share2 className="w-3 h-3" />
                            Share Masterpiece
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
