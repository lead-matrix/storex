"use client";

import { useCart } from "@/context/CartContext";
import { Plus, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
    description?: string;
}

interface Variant {
    id: string;
    name: string;
    price_override?: number;
}

export function ProductCard({
    product,
    variants = []
}: {
    product: Product;
    variants?: Variant[]
}) {
    const { addToCart } = useCart();
    const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants[0] || null);

    const price = selectedVariant?.price_override ?? product.base_price;
    const mainImage = product.images?.[0] || "/logo.jpg";

    const handleQuickAdd = () => {
        addToCart({
            id: selectedVariant?.id || product.id,
            productId: product.id,
            name: product.name,
            price: price,
            image: mainImage,
            quantity: 1,
            variantName: selectedVariant?.name,
        });
        setIsQuickBuyOpen(false);
    };

    return (
        <div className="group relative flex flex-col bg-black overflow-hidden animate-in fade-in duration-700">
            {/* Product Image */}
            <Link href={`/shop/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-white/5">
                <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <button className="bg-white text-black p-4 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </Link>

            {/* Product Info */}
            <div className="flex flex-col pt-6 pb-2 px-1">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/shop/${product.id}`}>
                        <h3 className="font-serif text-lg tracking-tight text-white hover:text-gold transition-colors">{product.name}</h3>
                    </Link>
                    <span className="text-sm font-light text-white/60">${price.toFixed(2)}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-light mb-6">
                    Premium Cosmetic Edition
                </p>

                {/* Action Button */}
                <Dialog open={isQuickBuyOpen} onOpenChange={setIsQuickBuyOpen}>
                    <DialogTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 border border-white/10 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 hover:border-gold hover:text-gold transition-all duration-500 group">
                            <Plus className="w-3 h-3 transition-transform group-hover:rotate-90 duration-500" />
                            Quick Add
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border border-white/10 text-white max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-2xl tracking-widest text-center mt-4">SELECT EDITION</DialogTitle>
                        </DialogHeader>
                        <div className="py-8 space-y-6">
                            <div className="relative aspect-[4/5] w-32 mx-auto bg-white/5">
                                <Image src={mainImage} alt={product.name} fill className="object-cover" />
                            </div>

                            {variants.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`py-3 px-4 text-[9px] uppercase tracking-widest border transition-all duration-300 ${selectedVariant?.id === v.id
                                                    ? "border-gold text-gold bg-gold/10"
                                                    : "border-white/10 text-white/50 hover:border-white/30"
                                                }`}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-[10px] uppercase tracking-[0.3em] text-white/40">Standard Collection Edition</p>
                            )}

                            <Button
                                onClick={handleQuickAdd}
                                className="w-full bg-gold text-black hover:bg-white py-6 uppercase text-[10px] tracking-[0.4em] font-bold"
                            >
                                Add to Bag — ${price.toFixed(2)}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
