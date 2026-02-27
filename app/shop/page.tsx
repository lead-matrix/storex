import { ProductGrid } from "@/components/ProductGrid";
import { Sparkles, Filter } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "The Boutique | DINA COSMETIC",
    description: "Discover the full collection within the Obsidian Palace. Shop luxury beauty and cosmetic products.",
};

interface ShopPageProps {
    searchParams: Promise<{ category?: string; filter?: string }>;
}

export default async function ShopPage(props: ShopPageProps) {
    const searchParams = await props.searchParams;
    const categorySlug = searchParams?.category;
    const filter = searchParams?.filter;

    const supabase = await createClient();

    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    let selectedCategory = null;
    if (categorySlug && categories) {
        selectedCategory = categories.find((cat) => cat.slug === categorySlug);
    }

    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury space-y-20">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-luxury-border pb-20">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-gold">
                            <Sparkles size={14} className="animate-pulse" />
                            <span className="text-xs uppercase tracking-[0.3em] font-medium">
                                {selectedCategory ? selectedCategory.name : "The Full Collection"}
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-serif tracking-tight text-white px-1">
                            {selectedCategory ? selectedCategory.name : "Boutique"}
                        </h1>
                    </div>
                    <p className="text-luxury-subtext text-xs uppercase tracking-widest max-w-sm text-center md:text-right leading-loose border-l md:border-l-0 md:border-r border-gold/20 px-6">
                        {selectedCategory?.description || "Synchronized perfection for those who demand absolute excellence in every application."}
                    </p>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-10 items-center justify-center md:justify-start">
                    <div className="flex items-center gap-3 text-gold border-r border-white/10 pr-10">
                        <Filter size={16} strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Refine</span>
                    </div>

                    <Link
                        href="/shop"
                        className={`text-[10px] uppercase tracking-widest transition-all duration-300 pb-1 border-b-2 
                            ${!categorySlug ? "text-white border-gold" : "text-luxury-subtext border-transparent hover:text-white"}`}
                    >
                        All Editions
                    </Link>

                    {categories?.map((category) => (
                        <Link
                            key={category.id}
                            href={`/shop?category=${category.slug}`}
                            className={`text-[10px] uppercase tracking-widest transition-all duration-300 pb-1 border-b-2 
                                ${categorySlug === category.slug ? "text-white border-gold" : "text-luxury-subtext border-transparent hover:text-white"}`}
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>

                {/* GRID */}
                <div className="min-h-[400px]">
                    <ProductGrid categoryId={selectedCategory?.id} filter={filter} />
                </div>

            </div>
        </div>
    );
}
