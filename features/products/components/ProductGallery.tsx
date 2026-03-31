"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface ProductGalleryProps {
    images: string[]
    productName: string
    /** When a variant is selected the page can override the displayed image */
    forcedImage?: string | null
}

export function ProductGallery({ images, productName, forcedImage }: ProductGalleryProps) {
    const safeImages = images && images.length > 0 ? images : ["/logo.jpg"]
    const [selectedIndex, setSelectedIndex] = useState(0)

    // When the parent provides a forced image (variant override), find & jump to it
    useEffect(() => {
        if (!forcedImage) return
        const idx = safeImages.indexOf(forcedImage)
        if (idx !== -1) {
            setSelectedIndex(idx)
        } else {
            // Image not in array — treat it as a temporary override by index -1 trick below
            setSelectedIndex(-1)
        }
    }, [forcedImage]) // eslint-disable-line react-hooks/exhaustive-deps

    // Resolve which image to display
    const displayImage =
        selectedIndex === -1 && forcedImage ? forcedImage : safeImages[selectedIndex]

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Main Image */}
            <div className="relative aspect-[4/5] w-full bg-obsidian border border-luxury-border overflow-hidden group">
                <Image
                    src={displayImage}
                    alt={`${productName} view`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    className="object-contain p-8 md:p-12 transition-all duration-700 ease-in-out group-hover:scale-105"
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
                            onClick={() => setSelectedIndex(index)}
                            className={`relative w-24 aspect-[4/5] flex-shrink-0 border-2 transition-all duration-300 
                                ${selectedIndex === index && selectedIndex !== -1
                                    ? "border-gold opacity-100"
                                    : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-contain object-center"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
