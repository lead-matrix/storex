"use client"

import { useState } from "react"
import { ProductGallery } from "@/features/products/components/ProductGallery"
import { ProductDetails } from "@/features/products/components/ProductDetails"

interface Variant {
    id: string
    title: string
    variant_type?: string
    sku?: string
    price_override?: number | null
    stock: number
    color_code?: string | null
    image_url?: string | null
    status?: string
}

interface Product {
    id: string
    title: string
    base_price: number
    description: string
    images: string[]
    variants?: Variant[]
}

interface ProductClientProps {
    product: Product
}

export function ProductClient({ product }: ProductClientProps) {
    const [variantImage, setVariantImage] = useState<string | null>(null)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            <div className="w-full animate-in fade-in slide-in-from-left-5 duration-1000">
                <ProductGallery
                    images={product.images}
                    productName={product.title}
                    forcedImage={variantImage}
                />
            </div>

            <div className="flex flex-col">
                <div className="pb-8">
                    <p className="text-gold text-[10px] uppercase tracking-[0.5em] font-medium mb-6">
                        Obsidian Masterpiece
                    </p>
                    <ProductDetails
                        product={{
                            id: product.id,
                            title: product.title,
                            base_price: product.base_price,
                            description: product.description || "The quintessence of modern luxury.",
                            images: product.images || ["/placeholder-product.jpg"],
                            product_variants: product.variants,
                        }}
                        onVariantImageChange={setVariantImage}
                    />
                </div>

                {/* PRODUCT ACCOLADES */}
                <div className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5">
                    <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-white font-bold mb-3 underline decoration-gold/30 underline-offset-4">
                            The Ritual
                        </h4>
                        <p className="text-luxury-subtext text-[11px] leading-relaxed font-light italic">
                            Apply with intention. Pressed gently into prepared skin.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-white font-bold mb-3 underline decoration-gold/30 underline-offset-4">
                            Integrity
                        </h4>
                        <p className="text-luxury-subtext text-[11px] leading-relaxed font-light italic">
                            Sustainably sourced. Vegan. Cruelty-free masterpiece.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
