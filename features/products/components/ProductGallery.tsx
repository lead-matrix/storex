"use client"

import { useState } from "react"
import Image from "next/image"

interface ProductGalleryProps {
    images: string[]
    productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const safeImages = images && images.length > 0 ? images : ["/logo.jpg"]

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Main Image */}
            <div className="relative aspect-[4/5] w-full bg-obsidian border border-luxury-border overflow-hidden group">
                <Image
                    src={safeImages[selectedImage]}
                    alt={`${productName} view ${selectedImage + 1}`}
                    fill
                    className="object-contain p-8 md:p-12 transition-transform duration-1000 ease-in-out group-hover:scale-105"
                    priority
                />
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Thumbnails */}
            {safeImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {safeImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`relative w-24 aspect-[4/5] flex-shrink-0 border-2 transition-all duration-300 
                                ${selectedImage === index
                                    ? "border-gold opacity-100"
                                    : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                                }`}
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
