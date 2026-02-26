import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { ProductDetails } from "@/features/products/components/ProductDetails";
import { ProductAccordion } from "@/features/products/components/ProductAccordion";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { cookies } from "next/headers";

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

    // Ensure we are in a dynamic context
    await cookies();

    const supabase = await createClient();

    // Fetch product by slug including variants
    const { data: product, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !product) {
        notFound();
    }

    // Fetch related products (active, excluding current)
    const { data: relatedProducts } = await supabase
        .from('products')
        .select('id, name, slug, base_price, images, description')
        .eq('is_active', true)
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4);

    const accordionItems = [
        {
            title: "Application Ritual",
            content: "For transformative results, apply to cleansed skin morning and evening. Warm an almond-sized amount between fingertips and press gently into the face, neck, and décolletage."
        },
        {
            title: "Formula Integrity",
            content: "Crafted without parabens, sulfates, or artificial fragrances. Dermatologically tested and cruelty-free. Sourced sustainably from ethical reserves."
        },
        {
            title: "Shipping & Exchanges",
            content: "Complimentary express delivery on all orders. Unopened products may be exchanged within 30 days of receipt through our signature concierge service."
        }
    ];

    return (
        <div className="bg-pearl min-h-screen pt-32 pb-0">
            <div className="px-6 max-w-7xl mx-auto space-y-16 animate-luxury-fade">
                <Link
                    href="/shop"
                    className="flex items-center gap-2 text-textsoft hover:text-charcoal transition-colors pb-8 uppercase text-xs tracking-luxury"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div className="w-full">
                        <ProductGallery images={product.images} productName={product.name} />
                    </div>

                    <div className="flex flex-col space-y-8">
                        <div className="border-b border-charcoal/10 pb-8">
                            <h3 className="text-gold text-[10px] uppercase tracking-luxury font-medium mb-3">
                                The Masterpiece Collection
                            </h3>
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

                        <div className="pt-4">
                            <ProductAccordion items={accordionItems} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-24">
                <RelatedProducts products={relatedProducts || []} />
            </div>
        </div>
    );
}
