import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { ProductClient } from "./ProductClient";

export const revalidate = 300;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: product } = await supabase
        .from("products")
        .select("title, description")
        .eq("slug", slug)
        .single();

    if (!product) return { title: "Product Not Found" };

    return {
        title: `${product.title} | DINA COSMETIC`,
        description: product.description,
    };
}

export default async function ProductSlugPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            product_variants (
                id,
                name,
                variant_type,
                sku,
                price_override,
                stock,
                color_code,
                image_url,
                weight,
                status
            )
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

    if (error || !product) {
        notFound();
    }

    const { data: relatedProducts } = await supabase
        .from('products')
        .select('id, title, slug, base_price, images, description, product_variants(id, name, price_override, stock, status)')
        .eq('status', 'active')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4);

    return (
        <div className="bg-black min-h-screen pt-32 pb-20 overflow-x-hidden">
            <div className="container-luxury space-y-12">
                <Link
                    href="/shop"
                    className="group flex items-center gap-3 text-luxury-subtext hover:text-gold transition-colors pb-8 uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    Back to Collection
                </Link>

                <ProductClient product={product} />
            </div>

            {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-40 border-t border-white/5 pt-32">
                    <div className="container-luxury">
                        <h2 className="text-2xl md:text-4xl font-serif text-white tracking-tight mb-20 text-center">
                            Selected Companions
                        </h2>
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            )}
        </div>
    );
}
