"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { Minus, Plus, ShoppingBag } from "lucide-react"

interface ProductDetailsProps {
    product: {
        id: string
        name: string
        price: number
        description: string
        image: string
        variants?: { id: string, name: string }[]
    }
}

export function ProductDetails({ product }: ProductDetailsProps) {
    const { addToCart, setIsCartOpen } = useCart()
    const [quantity, setQuantity] = useState(1)
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || "")

    const handleAddToCart = () => {
        addToCart({
            id: selectedVariant || product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.image,
            variantName: product.variants?.find(v => v.id === selectedVariant)?.name
        })
        setIsCartOpen(true)
    }

    return (
        <div className="flex flex-col animate-luxury-fade">
            <h1 className="text-3xl md:text-5xl font-heading text-charcoal tracking-luxury mb-4 font-medium">
                {product.name}
            </h1>
            <p className="text-xl text-textsoft font-light mb-8">${Number(product.price).toFixed(2)}</p>

            <div className="prose prose-sm text-textsoft mb-10 leading-relaxed font-light">
                <p>{product.description}</p>
            </div>

            {product.variants && product.variants.length > 0 && (
                <div className="mb-8">
                    <label className="text-xs uppercase tracking-luxury text-charcoal font-medium block mb-4">
                        Select Variant
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {product.variants.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariant(v.id)}
                                className={`px-4 py-2 border text-xs tracking-luxury uppercase transition-all duration-300 ${selectedVariant === v.id
                                    ? "border-charcoal bg-charcoal text-white"
                                    : "border-charcoal/20 text-charcoal hover:border-charcoal/50"
                                    }`}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-10 border-t border-b border-charcoal/10 py-6">
                <div className="flex items-center justify-between border border-charcoal/20 sm:w-1/3 w-full h-14 px-4 bg-white/50">
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
                    className="flex-grow h-14 bg-charcoal text-white hover:bg-gold hover:text-white hover:border-gold border-transparent font-medium"
                >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    ADD TO BAG
                </Button>
            </div>
        </div>
    )
}
