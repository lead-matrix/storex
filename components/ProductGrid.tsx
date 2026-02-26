"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";

interface Variant {
    id: string;
    name: string;
    price_override?: number | null;
    stock?: number;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    images: string[];
    description?: string;
    variants: Variant[];
    category_id?: string;
    is_featured?: boolean;
}

interface ProductGridProps {
    categoryId?: string;
    filter?: string;
}

export function ProductGrid({ categoryId, filter }: ProductGridProps = {}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchProducts() {
            // Include variants in the select
            let query = supabase
                .from("products")
                .select("id, name, slug, base_price, images, description, category_id, is_active, is_featured, variants(id, name, price_override, stock)")
                .eq("is_active", true);

            if (categoryId) {
                query = query.eq("category_id", categoryId);
            }

            if (filter === "new") {
                query = query.gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            }

            query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                setProducts((data ?? []) as unknown as Product[]);
            }
            setLoading(false);
        }

        fetchProducts();

        const supabaseClient = createClient();
        const productChannel = supabaseClient
            .channel("product-updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
                fetchProducts();
            })
            .subscribe();

        return () => {
            supabaseClient.removeChannel(productChannel);
        };
    }, [categoryId, filter]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
                <p className="text-white/25 uppercase tracking-[0.45em] text-[9px] font-light">Opening The Vault...</p>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="py-24 text-center">
                <p className="text-white/20 uppercase tracking-[0.5em] text-[10px] font-light">
                    The vault is currently sealed.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    variants={product.variants ?? []}
                />
            ))}
        </div>
    );
}
