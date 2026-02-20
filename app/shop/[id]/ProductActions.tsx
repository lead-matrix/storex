"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";

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
}

export function ProductActions({ product, variants }: { product: Product; variants: Variant[] }) {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants[0] || null);
    const [quantity, setQuantity] = useState(1);

    const price = selectedVariant?.price_override ?? product.base_price;

    const handleAddToCart = () => {
        addToCart({
            id: selectedVariant?.id || product.id,
            productId: product.id,
            name: product.name,
            price: price,
            image: product.images?.[0] || "/logo.jpg",
            quantity: quantity,
            variantName: selectedVariant?.name,
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Variant Selection */}
            {variants.length > 0 && (
                <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/60 font-bold">The Selection</p>
                    <div className="grid grid-cols-2 gap-4">
                        {variants.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariant(v)}
                                className={`py-5 px-6 text-[10px] uppercase tracking-[0.2em] border transition-all duration-500 font-medium ${selectedVariant?.id === v.id
                                    ? "border-gold-primary text-gold-primary bg-gold-primary/5"
                                    : "border-gold-primary/10 text-text-mutedDark/40 hover:border-gold-primary/30"
                                    }`}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quantity & Add to Bag */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border border-gold-primary/10 p-5 bg-background-secondary/30">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark/60 font-bold">Quantity</p>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="text-text-mutedDark/40 hover:text-gold-primary transition-colors p-2"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="text-text-mutedDark/40 hover:text-gold-primary transition-colors p-2"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="group relative w-full py-6 bg-gold-primary text-background-primary font-bold tracking-[0.4em] uppercase overflow-hidden transition-all duration-700 hover:shadow-[0_0_30px_rgb(var(--gold-primary)/0.3)] flex items-center justify-center gap-3"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" />
                        Secure Addition — ${(price * quantity).toFixed(2)}
                    </span>
                    <div className="absolute inset-0 bg-gold-hover translate-y-full transition-transform duration-500 group-hover:translate-y-0 z-0"></div>
                    <span className="absolute inset-0 flex items-center justify-center text-background-primary font-bold tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                        Add to Bag — ${(price * quantity).toFixed(2)}
                    </span>
                </button>

                <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-text-mutedDark/30 px-2 pt-2 font-light">
                    <span>Authentic Origin</span>
                    <span>Complimentary Returns</span>
                </div>
            </div>
        </div>
    );
}
