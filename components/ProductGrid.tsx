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
    sale_price?: number | null;
    on_sale?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
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
            try {
                // Querying for V2 but including fallback fields if they exist
                let query = supabase
                    .from("products")
                    .select("*")
                    .eq("status", "active")
                    .order("created_at", { ascending: false });

                if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);

                const { data, error } = await query;

                if (error) {
                    console.error("V2 Vault Query Failed, falling back to V1 compatibility mode:", error.message);
                    // Fallback to V1 if V2 schema isn't fully applied to DB yet
                    const { data: v1Data } = await supabase
                        .from("products")
                        .select("id, name, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, is_active")
                        .eq("is_active", true)
                        .limit(50);

                    if (v1Data) {
                        setProducts(v1Data.map((p: any) => ({ ...p, title: p.name })) as any);
                    }
                } else {
                    // Map V2 data to the UI expected 'Product' interface
                    const mapped = (data ?? []).map((p: any) => ({
                        ...p,
                        name: p.title, // Map V2 title to legacy name for components
                        variants: p.product_variants ? p.product_variants.map((v: any) => ({ ...v, name: v.title, price_override: v.price })) : []
                    }));
                    setProducts(mapped as any);
                }
            } catch (err) {
                console.error("CRITICAL VAULT ERROR:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();

        const productChannel = supabase
            .channel("product-updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 stagger-children">
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
