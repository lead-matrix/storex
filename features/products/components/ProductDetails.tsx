"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Minus, Plus, ShoppingBag } from "lucide-react"

interface Variant {
    id: string
    name: string
    variant_type?: string
    sku?: string
    price_override?: number | null
    stock: number
    color_code?: string | null
    image_url?: string | null
}

interface ProductDetailsProps {
    product: {
        id: string
        title: string
        base_price?: number
        sale_price?: number | null
        on_sale?: boolean
        description: string
        images: string[]
        product_variants?: Variant[]
    }
    /** Called when a variant's image should update the gallery */
    onVariantImageChange?: (imageUrl: string | null) => void
}

export function ProductDetails({ product, onVariantImageChange }: ProductDetailsProps) {
    const { addToCart, setIsCartOpen } = useCart()
    const [quantity, setQuantity] = useState(1)

    const activeVariants = (product.product_variants ?? []).filter(
        (v) => (v as any).status !== "draft"
    )

    const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id ?? "")

    const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId)

    // Calculate display price
    // If a variant is selected, use its override.
    // If no override, use base_price.
    // If base_price is 0/null, use the minimum among all variants.
    const getInitialPrice = () => {
        // If the product is on sale, sale price absolutely overrides everything
        if (product.on_sale && product.sale_price != null) {
            return product.sale_price;
        }

        if (selectedVariant?.price_override != null) return selectedVariant.price_override
        if (product.base_price && product.base_price > 0) return product.base_price

        // Fallback: find any variant with a price
        const prices = activeVariants
            .map(v => v.price_override)
            .filter((p): p is number => p != null && p > 0)

        return prices.length > 0 ? Math.min(...prices) : (product.base_price || 0)
    }

    // Original price without the sale applied (for strikethrough)
    const getOriginalPrice = () => {
        if (selectedVariant?.price_override != null) return selectedVariant.price_override
        if (product.base_price && product.base_price > 0) return product.base_price
        
        const prices = activeVariants
            .map(v => v.price_override)
            .filter((p): p is number => p != null && p > 0)

        return prices.length > 0 ? Math.min(...prices) : (product.base_price || 0)
    }

    const displayPrice = getInitialPrice()
    const originalPrice = getOriginalPrice()

    const currentStock = selectedVariant?.stock ?? 0
    const isOutOfStock = currentStock <= 0

    const handleVariantSelect = (variant: Variant) => {
        setSelectedVariantId(variant.id)
        setQuantity(1) // reset quantity when switching variant
        if (onVariantImageChange) {
            onVariantImageChange(variant.image_url ?? null)
        }
    }

    const handleAddToCart = () => {
        if (isOutOfStock) return

        addToCart({
            id: selectedVariantId || product.id,
            productId: product.id,
            variantId: selectedVariantId || undefined,
            name: selectedVariant
                ? `${product.title} – ${selectedVariant.name}`
                : product.title,
            price: Number(displayPrice),
            quantity: Math.min(quantity, currentStock),
            image: selectedVariant?.image_url || product.images[0] || "",
            variantName: selectedVariant?.name,
        })
        setIsCartOpen(true)
    }

    // Group variants by type so we can render separate rows
    const variantsByType = activeVariants.reduce<Record<string, Variant[]>>((acc, v) => {
        const type = v.variant_type || "option"
        if (!acc[type]) acc[type] = []
        acc[type].push(v)
        return acc
    }, {})

    const variantTypes = Object.keys(variantsByType)

    return (
        <div className="flex flex-col animate-in fade-in duration-1000">
            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-4 leading-tight uppercase font-light">
                {product.title}
            </h1>

            <div className="flex items-center gap-4 mb-8">
                {product.on_sale && product.sale_price != null ? (
                    <div className="flex items-center gap-3">
                        <p className="text-lg text-white/40 line-through decoration-gold/50 font-serif">
                            ${Number(originalPrice).toFixed(2)}
                        </p>
                        <p className="text-3xl text-gold font-bold font-serif shadow-gold">
                            ${Number(displayPrice).toFixed(2)}
                        </p>
                        <span className="text-[9px] uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-1 rounded-sm border border-red-500/20 font-bold ml-2">Sale</span>
                    </div>
                ) : (
                    <p className="text-2xl text-gold font-light font-serif">
                        ${Number(displayPrice).toFixed(2)}
                    </p>
                )}
                
                {selectedVariant?.sku && (
                    <span className="text-[10px] text-luxury-subtext border border-white/10 px-2 py-0.5 rounded tracking-widest uppercase ml-auto">
                        SKU: {selectedVariant.sku}
                    </span>
                )}
            </div>

            <div className="text-luxury-subtext text-sm mb-12 leading-relaxed font-light max-w-lg border-l border-gold/20 pl-6 italic whitespace-pre-wrap">
                <p>{product.description}</p>
            </div>

            {variantTypes.length > 0 && (
                <div className="space-y-10 mb-12">
                    {variantTypes.map((type) => {
                        const isColorGroup = ["shade", "color"].includes(type.toLowerCase())
                        return (
                            <div key={type} className="animate-in slide-in-from-bottom-2 duration-700">
                                <label className="text-[9px] uppercase tracking-[0.3em] text-gold font-bold block mb-4">
                                    {type === 'option' ? 'Selection' : `Select ${type}`}
                                </label>

                                <div className="flex flex-wrap gap-3">
                                    {variantsByType[type].map((v) => {
                                        const isSelected = selectedVariantId === v.id

                                        if (isColorGroup && v.color_code) {
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => handleVariantSelect(v)}
                                                    title={v.name}
                                                    className={`group relative flex flex-col items-center gap-2 transition-all duration-500`}
                                                >
                                                    <div
                                                        className={`w-12 h-12 rounded-full border-2 transition-all duration-500 p-1
                                                            ${isSelected
                                                                ? "border-gold scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                                                                : "border-white/5 hover:border-white/20"
                                                            }`}
                                                    >
                                                        <div
                                                            className="w-full h-full rounded-full"
                                                            style={{ backgroundColor: v.color_code }}
                                                        />
                                                    </div>
                                                    <span
                                                        className={`text-[8px] uppercase tracking-widest font-medium transition-colors
                                                            ${isSelected ? "text-gold" : "text-luxury-subtext group-hover:text-white"}`}
                                                    >
                                                        {v.name}
                                                    </span>
                                                </button>
                                            )
                                        }

                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => handleVariantSelect(v)}
                                                className={`px-6 py-3 border text-[9px] tracking-[0.2em] uppercase transition-all duration-300 font-bold
                                                    ${isSelected
                                                        ? "border-gold bg-gold text-black shadow-luxury-gold"
                                                        : "border-white/10 text-luxury-subtext hover:border-white/30 hover:bg-white/5"
                                                    }`}
                                            >
                                                {v.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
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
                    <span className="text-sm font-medium text-white font-serif">
                        {isOutOfStock ? 0 : quantity}
                    </span>
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
                        ${isOutOfStock ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed uppercase" : ""}`}
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

            <p
                className={`text-[9px] uppercase tracking-[0.4em] text-center sm:text-left mt-6 ${isOutOfStock ? "text-red-500 font-bold" : "text-white/20"
                    }`}
            >
                {isOutOfStock
                    ? "Inventory Depleted"
                    : `Limited Selection · ${currentStock} Assets Left`}
            </p>
        </div>
    )
}
