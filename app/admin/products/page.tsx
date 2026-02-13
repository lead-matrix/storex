"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Pencil, Trash2, ExternalLink, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { deleteProduct } from "@/lib/actions/admin";
import Image from "next/image";
import { toast } from "sonner";

interface Variant {
    id: string;
    name: string;
    stock_quantity: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    is_featured: boolean;
    images: string[];
    variants: Variant[];
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*, variants(id, name, stock_quantity)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching products:", error);
        } else {
            setProducts((data as any[]) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to banish this artifact to the void?")) return;

        try {
            await deleteProduct(id);
            toast.success("Artifact Banished");
            fetchProducts();
        } catch (error) {
            toast.error("Banishment Failed");
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px]">Scanning The Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif text-gold mb-1">Vault Inventory</h2>
                    <p className="text-zinc-500 text-sm tracking-widest uppercase">Manage your luxury collection</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="bg-gold text-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors flex items-center gap-2"
                >
                    <Plus size={14} />
                    Forge New Item
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-zinc-950 border border-gold/10 p-6 flex flex-col md:flex-row gap-6 items-center group hover:border-gold/30 transition-all">
                        <div className="w-24 h-24 bg-zinc-900 border border-gold/5 flex-shrink-0 relative overflow-hidden">
                            {product.images?.[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700 uppercase">No Image</div>
                            )}
                        </div>

                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-serif text-white">{product.name}</h3>
                                {product.is_featured && (
                                    <span className="text-[8px] border border-gold/50 text-gold px-2 py-0.5 tracking-widest uppercase">Featured</span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500 line-clamp-1 mb-2 font-sans">{product.description}</p>
                            <div className="flex gap-4 text-[10px] uppercase tracking-widest font-medium">
                                <span className="text-gold">${product.base_price}</span>
                                <span className="text-zinc-600">|</span>
                                <span className="text-zinc-400">{product.variants?.length || 0} Variants</span>
                                <span className="text-zinc-600">|</span>
                                <span className={product.variants?.reduce((acc: number, v: Variant) => acc + (v.stock_quantity || 0), 0) > 0 ? "text-emerald-500" : "text-rose-500"}>
                                    Stock: {product.variants?.reduce((acc: number, v: Variant) => acc + (v.stock_quantity || 0), 0) || 0}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/shop/${product.id}`}
                                target="_blank"
                                className="p-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
                            >
                                <ExternalLink size={16} />
                            </Link>
                            <Link
                                href={`/admin/products/${product.id}`}
                                className="p-3 border border-zinc-800 text-zinc-500 hover:text-gold hover:border-gold/30 transition-all"
                            >
                                <Pencil size={16} />
                            </Link>
                            <button
                                onClick={() => handleDelete(product.id)}
                                className="p-3 border border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {!products.length && (
                    <div className="py-20 text-center border border-dashed border-gold/20 flex flex-col items-center justify-center">
                        <Package size={40} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-500 uppercase tracking-widest text-[10px]">The vault is currently empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
