"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

    // Filter active variants
    const activeVariants = product.variants?.filter(v => v.is_active !== false) ?? []
    const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id || "")

    const selectedVariant = activeVariants.find(v => v.id === selectedVariantId)
    // Locked Pricing Logic: selectedVariant?.price_override ?? product.base_price
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

    // Group variants by type for rendering
    const variantType = activeVariants[0]?.variant_type || 'shade'

    return (
        <div className="flex flex-col animate-luxury-fade">
            <h1 className="text-3xl md:text-5xl font-heading text-charcoal tracking-luxury mb-4 font-medium">
                {product.name}
            </h1>
            <p className="text-xl text-textsoft font-light mb-8">${Number(displayPrice).toFixed(2)}</p>

            <div className="prose prose-sm text-textsoft mb-10 leading-relaxed font-light">
                <p>{product.description}</p>
            </div>

            {activeVariants.length > 0 && (
                <div className="mb-8">
                    <label className="text-[10px] uppercase tracking-luxury text-charcoal font-bold block mb-4">
                        Select {variantType === 'shade' ? 'Shade' : variantType === 'size' ? 'Size' : 'Option'}
                    </label>

                    {variantType === 'shade' ? (
                        /* Color Swatches for Shades */
                        <div className="flex flex-wrap gap-3">
                            {activeVariants.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    title={v.name}
                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${selectedVariantId === v.id
                                        ? "border-gold scale-110"
                                        : "border-charcoal/10 hover:border-charcoal/30"
                                        }`}
                                >
                                    <div
                                        className="w-7 h-7 rounded-full shadow-inner"
                                        style={{ backgroundColor: v.color_code || '#ccc' }}
                                    />
                                    {selectedVariantId === v.id && (
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-widest text-gold font-bold">
                                            {v.name}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Pill Buttons for Sizes/Types */
                        <div className="flex flex-wrap gap-3">
                            {activeVariants.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    className={`px-6 py-2 border text-[10px] tracking-luxury uppercase transition-all duration-500 font-medium ${selectedVariantId === v.id
                                        ? "border-charcoal bg-charcoal text-white"
                                        : "border-charcoal/20 text-textsoft hover:border-charcoal/50"
                                        }`}
                                >
                                    {v.name}
                                    {v.price_override && v.price_override !== product.base_price && (
                                        <span className="ml-2 opacity-60">
                                            (${Number(v.price_override).toFixed(2)})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    {variantType === 'shade' && <div className="h-6" />} {/* Spacer for shade labels */}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-10 border-t border-b border-charcoal/10 py-6 mt-4">
                <div className="flex items-center justify-between border border-charcoal/10 sm:w-1/3 w-full h-14 px-5 bg-white/50 backdrop-blur-sm">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-textsoft hover:text-charcoal transition-colors p-2"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-charcoal">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-textsoft hover:text-charcoal transition-colors p-2"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <Button
                    onClick={handleAddToCart}
                    variant="luxury"
                    className="flex-grow h-14 bg-charcoal text-white hover:bg-gold hover:text-white hover:border-gold border-transparent font-bold tracking-luxury text-[11px]"
                >
                    <ShoppingBag className="w-4 h-4 mr-3" />
                    ADD TO BAG — ${(displayPrice * quantity).toFixed(2)}
                </Button>
            </div>
        </div>
    )
}

