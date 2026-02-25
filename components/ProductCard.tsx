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
    price: number;       // from DB (correct column name)
    base_price?: number; // legacy alias if used elsewhere
    images: string[];
    description?: string;
}

interface Variant {
    id: string;
    name: string;
    price_override?: number | null;
    stock_quantity?: number;
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

    // Support both 'price' (DB column) and 'base_price' (legacy)
    const basePrice = product.price ?? product.base_price ?? 0;
    const price = selectedVariant?.price_override ?? basePrice;
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
        <div className="group relative flex flex-col bg-background-primary overflow-hidden animate-in fade-in duration-700">
            {/* Product Image */}
            <Link href={`/shop/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-background-secondary/30">
                <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-background-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <button className="bg-background-light text-text-headingLight p-4 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </Link>

            {/* Product Info */}
            <div className="flex flex-col pt-6 pb-2 px-1">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/shop/${product.id}`}>
                        <h3 className="font-serif text-lg tracking-tight text-text-headingDark hover:text-gold-primary transition-colors">{product.name}</h3>
                    </Link>
                    <span className="text-sm font-light text-text-bodyDark/60">${price.toFixed(2)}</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark font-light mb-6">
                    Premium Cosmetic Edition
                </p>

                {/* Action Button */}
                <Dialog open={isQuickBuyOpen} onOpenChange={setIsQuickBuyOpen}>
                    <DialogTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 border border-gold-accent/40 py-3 text-[10px] uppercase tracking-[0.3em] text-text-bodyDark/60 hover:border-gold-primary hover:text-gold-primary transition-all duration-500 group">
                            <Plus className="w-3 h-3 transition-transform group-hover:rotate-90 duration-500" />
                            Quick Add
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-background-primary border border-gold-primary/10 text-text-bodyDark max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-2xl tracking-widest text-center mt-4 text-text-headingDark">SELECT EDITION</DialogTitle>
                        </DialogHeader>
                        <div className="py-8 space-y-6">
                            <div className="relative aspect-[4/5] w-32 mx-auto bg-background-secondary/30">
                                <Image src={mainImage} alt={product.name} fill className="object-cover" />
                            </div>

                            {variants.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`py-3 px-4 text-[9px] uppercase tracking-widest border transition-all duration-300 ${selectedVariant?.id === v.id
                                                ? "border-gold-primary text-gold-primary bg-gold-primary/10"
                                                : "border-gold-accent/10 text-text-mutedDark hover:border-gold-accent/30"
                                                }`}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-[10px] uppercase tracking-[0.3em] text-text-mutedDark">Standard Collection Edition</p>
                            )}

                            <Button
                                onClick={handleQuickAdd}
                                className="w-full bg-gold-primary text-background-primary hover:bg-gold-hover py-6 uppercase text-[10px] tracking-[0.4em] font-bold"
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
