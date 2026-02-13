"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { ProductForm } from "@/components/admin/ProductForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";

export default function EditProductPage() {
    const params = useParams();
    const id = params?.id as string;
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, variants(*)')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error("Product not found");
                setProduct(null);
            } else {
                setProduct(data);
            }
            setLoading(false);
        };

        if (id) fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Calling Artifact...</p>
            </div>
        );
    }

    if (!product) {
        return notFound();
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-zinc-500 hover:text-gold transition-colors"
            >
                <ArrowLeft size={12} />
                Back to Vault
            </Link>

            <div>
                <h2 className="text-3xl font-serif text-gold mb-1">Refine Masterpiece</h2>
                <p className="text-zinc-500 text-sm tracking-widest uppercase">Evolving the {product.name}</p>
            </div>

            <div className="bg-zinc-950 border border-gold/10 p-8 shadow-2xl">
                <ProductForm product={product} />
            </div>
        </div>
    );
}
