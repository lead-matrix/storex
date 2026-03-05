"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Minus, Plus, ShoppingBag } from "lucide-react"

interface ProductDetailsProps {
    product: {
        id: string
        title: string
        base_price?: number
        description: string
        images: string[]
        product_variants?: {
            id: string,
            title: string,
            sku?: string,
            price: number,
            compare_price?: number | null,
            inventory?: {
                stock_quantity: number
            }
        }[]
    }
}

export function ProductDetails({ product }: ProductDetailsProps) {
    const { addToCart, setIsCartOpen } = useCart()
    const [quantity, setQuantity] = useState(1)

    const activeVariants = product.product_variants || []
    const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id || "")

    const selectedVariant = activeVariants.find(v => v.id === selectedVariantId)
    const displayPrice = selectedVariant?.price ?? product.base_price ?? 0
    const currentStock = selectedVariant?.inventory?.stock_quantity ?? 0
    const isOutOfStock = currentStock <= 0

    const handleAddToCart = () => {
        if (isOutOfStock) return

        addToCart({
            id: selectedVariantId || product.id,
            productId: product.id,
            name: product.title,
            price: Number(displayPrice),
            quantity: Math.min(quantity, currentStock),
            image: product.images[0] || '',
            variantName: selectedVariant?.title
        })
        setIsCartOpen(true)
    }

    return (
        <div className="flex flex-col animate-in fade-in duration-1000">
            <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight mb-4 leading-tight">
                {product.title}
            </h1>

            <p className="text-2xl text-gold font-light mb-8 font-serif italic">${Number(displayPrice).toFixed(2)}</p>

            <div className="text-luxury-subtext text-sm mb-12 leading-relaxed font-light max-w-lg">
                <p>{product.description}</p>
            </div>

            {activeVariants.length > 0 && (
                <div className="mb-12">
                    <label className="text-[10px] uppercase tracking-widest text-gold font-bold block mb-6">
                        Select Edition
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
                                {v.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between border border-white/10 w-full sm:w-40 h-16 px-6 bg-obsidian">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock}
                        className="text-white/40 hover:text-gold transition-colors disabled:opacity-20"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-white font-serif">{isOutOfStock ? 0 : quantity}</span>
                    <button
                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= currentStock}
                        className="text-white/40 hover:text-gold transition-colors disabled:opacity-20"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`btn-gold flex-grow h-16 flex items-center justify-center gap-4 text-sm font-bold transition-all
                        ${isOutOfStock ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed uppercase' : ''}`}
                >
                    {isOutOfStock ? (
                        <>Vault Empty — Restocking Soon</>
                    ) : (
                        <>
                            <ShoppingBag size={18} strokeWidth={1.5} />
                            Add To Bag — ${(displayPrice * quantity).toFixed(2)}
                        </>
                    )}
                </button>
            </div>

            <p className={`text-[9px] uppercase tracking-[0.4em] text-center sm:text-left mt-6 ${isOutOfStock ? 'text-red-500 font-bold' : 'text-white/20'}`}>
                {isOutOfStock ? 'Inventory Depleted' : `Limited Selection · ${currentStock} Assets Left`}
            </p>
        </div>
    )
}
