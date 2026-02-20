"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";

interface Variant {
    id: string;
    name: string;
    price_override?: number;
}

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
    variants: Variant[];
    category_id?: string;
}

interface ProductGridProps {
    categoryId?: string;
    filter?: string;
}

export function ProductGrid({ categoryId, filter }: ProductGridProps = {}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            let query = supabase
                .from("products")
                .select("*, variants(*)")
                .eq("is_active", true);

            // Filter by category if provided
            if (categoryId) {
                query = query.eq("category_id", categoryId);
            }

            // Apply additional filters
            if (filter === "new") {
                query = query.gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            } else if (filter === "bestsellers") {
                query = query.order("created_at", { ascending: false });
            } else {
                query = query.order("created_at", { ascending: false });
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                setProducts((data as any[]) || []);
            }
            setLoading(false);
        }

        fetchProducts();

        // Subscribe to real-time changes for instant synchronization
        const productChannel = supabase
            .channel('product-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                fetchProducts();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' }, () => {
                fetchProducts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(productChannel);
        };
    }, [categoryId, filter]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
                <p className="text-text-mutedDark uppercase tracking-[0.4em] text-[10px] font-light italic">Opening The Vault...</p>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div id="shop" className="py-24 text-center">
                <p className="text-text-mutedDark/30 uppercase tracking-[0.5em] text-xs font-light">The vault is currently sealed.</p>
            </div>
        );
    }

    return (
        <div id="shop" className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="space-y-4">
                    <p className="text-gold-primary uppercase tracking-[0.4em] text-[10px] font-light">Curated Selection</p>
                    <h2 className="text-4xl md:text-6xl font-serif text-text-headingDark tracking-tight italic">The Essentials</h2>
                </div>
                <p className="text-text-mutedDark text-[10px] uppercase tracking-[0.3em] font-light max-w-xs text-right hidden md:block leading-loose">
                    Meticulously formulated beauty and skincare products for the discerning elite.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
                {products.map((product: Product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        variants={product.variants}
                    />
                ))}
            </div>
        </div>
    );
}
