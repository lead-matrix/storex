"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "lucide-react"

export interface ProductCardProps {
    product: {
        id: string
        name: string
        slug: string
        price: number
        images: string[]
        categories?: string[]
    }
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <div className="group flex flex-col items-center bg-white p-4 rounded-luxury shadow-soft hover:shadow-luxury transition-all duration-500 border border-charcoal/5 h-full">
            <Link href={`/shop/${product.id}`} className="w-full relative aspect-[4/5] overflow-hidden rounded-md bg-pearl mb-6 block">
                <Image
                    src={product.images?.[0] || "/placeholder-product.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/5 transition-colors duration-500" />
            </Link>

            <div className="w-full text-center flex flex-col flex-grow items-center justify-between">
                <div className="mb-4">
                    <Link href={`/shop/${product.id}`}>
                        <h3 className="text-lg font-heading text-charcoal tracking-luxury mb-2 font-medium group-hover:text-gold transition-colors line-clamp-2">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-textsoft uppercase tracking-luxury">${Number(product.price).toFixed(2)}</p>
                </div>

                {/* Decorative divider */}
                <div className="w-8 h-px bg-gold/50 my-4" />

                <Button
                    variant="outline"
                    className="w-full uppercase text-[10px] tracking-luxury"
                >
                    <ShoppingBag className="w-3 h-3 mr-2 hidden sm:block delay-100 group-hover:animate-bounce" />
                    View Details
                </Button>
            </div>
        </div>
    )
}
