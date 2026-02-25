import { ProductGrid } from "@/components/ProductGrid";
import { Sparkles, Filter } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Shop All Products",
    description: "Discover our complete collection of luxury beauty and cosmetic products. Shop premium skincare, makeup, and beauty essentials.",
    openGraph: {
        title: "Shop All Products | DINA COSMETIC",
        description: "Discover our complete collection of luxury beauty products",
    },
};

interface ShopPageProps {
    searchParams: Promise<{ category?: string; filter?: string }>;
}

export default async function ShopPage(props: ShopPageProps) {
    const searchParams = await props.searchParams;
    const categorySlug = searchParams?.category;
    const filter = searchParams?.filter;

    const supabase = await createClient();

    // Fetch categories for filter buttons
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    // Find selected category
    let selectedCategory = null;
    if (categorySlug && categories) {
        selectedCategory = categories.find((cat) => cat.slug === categorySlug);
    }

    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen pt-32">
            <div className="px-6 max-w-7xl mx-auto space-y-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-gold-primary/10 pb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gold-primary">
                            <Sparkles size={12} className="animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.5em] font-light">
                                {selectedCategory ? selectedCategory.name : "The Full Collection"}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter text-text-headingDark">
                            {selectedCategory ? selectedCategory.name : "Boutique"}
                        </h1>
                    </div>
                    <p className="text-text-mutedDark text-[10px] uppercase tracking-[0.3em] max-w-xs text-right leading-loose">
                        {selectedCategory?.description || "Synchronized perfection for those who demand absolute excellence in every application."}
                    </p>
                </div>

                {/* Categories / Filter Bar */}
                <div className="flex flex-wrap gap-8 items-center text-[10px] uppercase tracking-[0.3em] font-light border-b border-text-mutedDark/5 pb-8">
                    <div className="flex items-center gap-2 text-gold-primary mr-8">
                        <Filter size={12} />
                        <span>Filter:</span>
                    </div>
                    <Link
                        href="/shop"
                        className={`transition-colors ${!categorySlug ? "text-gold-primary" : "text-text-bodyDark/40 hover:text-gold-primary"
                            }`}
                    >
                        All
                    </Link>
                    {categories?.map((category) => (
                        <Link
                            key={category.id}
                            href={`/shop?category=${category.slug}`}
                            className={`transition-colors ${categorySlug === category.slug
                                ? "text-gold-primary"
                                : "text-text-bodyDark/40 hover:text-gold-primary"
                                }`}
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <ProductGrid categoryId={selectedCategory?.id} filter={filter} />
                </div>
            </div>
        </div>
    );
}
