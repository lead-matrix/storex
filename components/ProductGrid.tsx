"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
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
}

export function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase
                .from("products")
                .select("*, variants(*)")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                setProducts((data as any[]) || []);
            }
            setLoading(false);
        }
        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-light italic">Opening The Vault...</p>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div id="shop" className="py-24 text-center">
                <p className="text-white/30 uppercase tracking-[0.5em] text-xs font-light">The vault is currently sealed.</p>
            </div>
        );
    }

    return (
        <div id="shop" className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="space-y-4">
                    <p className="text-gold uppercase tracking-[0.4em] text-[10px] font-light">Curated Selection</p>
                    <h2 className="text-4xl md:text-6xl font-serif text-white tracking-tight italic">The Essentials</h2>
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-light max-w-xs text-right hidden md:block leading-loose">
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
