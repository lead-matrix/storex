"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Minus, Plus, ShoppingBag } from "lucide-react"

interface ProductDetailsProps {
    product: {
        id: string
        name: string
        base_price: number
        description: string
        image: string
        variants?: {
            id: string,
            name: string,
            variant_type?: 'shade' | 'size' | 'bundle' | 'type',
            price_override?: number | null,
            color_code?: string,
            stock?: number,
            is_active?: boolean
        }[]
    }
}

export function ProductDetails({ product }: ProductDetailsProps) {
    const { addToCart, setIsCartOpen } = useCart()
    const [quantity, setQuantity] = useState(1)

    const activeVariants = product.variants?.filter(v => v.is_active !== false) ?? []
    const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id || "")

    const selectedVariant = activeVariants.find(v => v.id === selectedVariantId)
    const displayPrice = selectedVariant?.price_override ?? product.base_price

    const handleAddToCart = () => {
        addToCart({
            id: selectedVariantId || product.id,
            productId: product.id,
            name: product.name,
            price: Number(displayPrice),
            quantity,
            image: product.image,
            variantName: selectedVariant?.name
        })
        setIsCartOpen(true)
    }

    const variantType = activeVariants[0]?.variant_type || 'shade'

    return (
        <div className="flex flex-col animate-in fade-in duration-1000">
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight mb-4 leading-tight">
                {product.name}
            </h1>

            <p className="text-2xl text-gold font-light mb-8 font-serif italic">${Number(displayPrice).toFixed(2)}</p>

            <div className="text-luxury-subtext text-sm mb-12 leading-relaxed font-light max-w-lg">
                <p>{product.description}</p>
            </div>

            {activeVariants.length > 0 && (
                <div className="mb-12">
                    <label className="text-[10px] uppercase tracking-widest text-gold font-bold block mb-6">
                        Select {variantType === 'shade' ? 'Shade Edition' : 'Edition'}
                    </label>

                    <div className="flex flex-wrap gap-4">
                        {activeVariants.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariantId(v.id)}
                                className={`px-8 py-3 border text-[10px] tracking-widest uppercase transition-all duration-300 font-medium 
                                    ${selectedVariantId === v.id
                                        ? "border-gold bg-gold text-black scale-105"
                                        : "border-white/10 text-luxury-subtext hover:border-white/30"
                                    }`}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-white/5">
                {/* QUANTITY PICKER */}
                <div className="flex items-center justify-between border border-white/10 w-full sm:w-40 h-16 px-6 bg-obsidian">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-white/40 hover:text-gold transition-colors"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-white font-serif">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-white/40 hover:text-gold transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="btn-gold flex-grow h-16 flex items-center justify-center gap-4 text-sm font-bold"
                >
                    <ShoppingBag size={18} strokeWidth={1.5} />
                    Add To Bag — ${(displayPrice * quantity).toFixed(2)}
                </button>
            </div>

            <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 text-center sm:text-left mt-6">
                Artisanal Batch · Limited Availability
            </p>
        </div>
    )
}
