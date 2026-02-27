import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { ProductDetails } from "@/features/products/components/ProductDetails";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: product } = await supabase
        .from("products")
        .select("name, description")
        .eq("slug", slug)
        .single();

    if (!product) return { title: "Product Not Found" };

    return {
        title: `${product.name} | DINA COSMETIC`,
        description: product.description,
    };
}

export default async function ProductSlugPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !product) {
        notFound();
    }

    const { data: relatedProducts } = await supabase
        .from('products')
        .select('id, name, slug, base_price, images, description')
        .eq('is_active', true)
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4);

    return (
        <div className="bg-black min-h-screen pt-32 pb-20">
            <div className="container-luxury space-y-12">
                <Link
                    href="/shop"
                    className="group flex items-center gap-3 text-luxury-subtext hover:text-gold transition-colors pb-8 uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    Back to Collection
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    <div className="w-full animate-in fade-in slide-in-from-left-5 duration-1000">
                        <ProductGallery images={product.images} productName={product.name} />
                    </div>

                    <div className="flex flex-col">
                        <div className="pb-8">
                            <p className="text-gold text-[10px] uppercase tracking-[0.5em] font-medium mb-6">
                                Obsidian Masterpiece
                            </p>
                            <ProductDetails
                                product={{
                                    id: product.id,
                                    name: product.name,
                                    base_price: product.base_price,
                                    description: product.description || "The quintessence of modern luxury.",
                                    image: product.images?.[0] || "/placeholder-product.jpg",
                                    variants: product.variants
                                }}
                            />
                        </div>

                        {/* PRODUCT ACCOLADES */}
                        <div className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest text-white font-bold mb-3 underline decoration-gold/30 underline-offset-4">The Ritual</h4>
                                <p className="text-luxury-subtext text-[11px] leading-relaxed font-light italic">Apply with intention. Pressed gently into prepared skin.</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest text-white font-bold mb-3 underline decoration-gold/30 underline-offset-4">Integrity</h4>
                                <p className="text-luxury-subtext text-[11px] leading-relaxed font-light italic">Sustainably sourced. Vegan. Cruelty-free masterpiece.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-40 border-t border-white/5 pt-32">
                    <div className="container-luxury">
                        <h2 className="text-2xl md:text-4xl font-serif text-white tracking-tight mb-20 text-center">Selected Companions</h2>
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            )}
        </div>
    );
}
