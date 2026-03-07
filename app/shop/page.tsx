import { ProductGrid } from "@/components/ProductGrid";
import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

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

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
    }

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

                {/* HEADER / BOUTIQUE SECTION */}
                <section className="py-32 bg-background text-textPrimary tracking-[0.1em]">
                    <div className="max-w-5xl mx-auto px-6 text-center">

                        <p className="text-sm tracking-[0.3em] text-primary uppercase mb-6">
                            ✦ {selectedCategory ? selectedCategory.name : "The Full Collection"}
                        </p>

                        <h2 className="text-5xl md:text-6xl font-playfair italic mb-8 tracking-[0.1em]">
                            {selectedCategory ? selectedCategory.name : "Boutique"}
                        </h2>

                        <p className="text-lg text-textSecondary leading-relaxed max-w-2xl mx-auto tracking-[0.1em]">
                            {selectedCategory?.description || "Synchronized perfection for those who demand absolute excellence in every application."}
                        </p>

                    </div>
                </section>

                {/* FILTERS */}
                <div className="flex justify-center gap-10 border-b border-border pb-6 tracking-[0.1em]">
                    <div className="flex items-center gap-3 text-textSecondary border-r border-border pr-10">
                        <span className="text-xs uppercase font-bold">Refine</span>
                    </div>

                    <Link
                        href="/shop"
                        className={`text-xs uppercase transition-all duration-300 pb-1 border-b-2 
                            ${!categorySlug ? "text-textPrimary border-primary" : "text-textSecondary border-transparent hover:text-textPrimary"}`}
                    >
                        All Editions
                    </Link>

                    {categories?.map((category) => (
                        <Link
                            key={category.id}
                            href={`/shop?category=${category.slug}`}
                            className={`text-xs uppercase transition-all duration-300 pb-1 border-b-2 
                                ${categorySlug === category.slug ? "text-textPrimary border-primary" : "text-textSecondary border-transparent hover:text-textPrimary"}`}
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
