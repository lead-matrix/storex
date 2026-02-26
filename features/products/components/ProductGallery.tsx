"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
    images: string[]
    productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0)

    // Guard against empty images
    const safeImages = images && images.length > 0 ? images : ["/placeholder-product.jpg"]

    return (
        <div className="flex flex-col md:flex-row-reverse gap-6 h-full">
            {/* Main Image */}
            <div className="relative aspect-[4/5] md:aspect-auto md:h-[600px] w-full bg-pearl rounded-luxury overflow-hidden border border-charcoal/5 flex-grow group">
                <Image
                    src={safeImages[selectedImage]}
                    alt={`${productName} view ${selectedImage + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-charcoal/0 pointer-events-none group-hover:bg-charcoal/5 transition-colors duration-500" />
            </div>

            {/* Thumbnails */}
            {safeImages.length > 1 && (
                <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-24 flex-shrink-0">
                    {safeImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={cn(
                                "relative w-20 h-24 md:w-full md:h-32 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-300",
                                selectedImage === index
                                    ? "border-gold/50 opacity-100"
                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-charcoal/10"
                            )}
                        >
                            <Image
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
