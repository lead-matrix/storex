"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

interface Product {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    sale_price?: number | null;
    on_sale?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
    images: string[];
    description?: string;
    is_active?: boolean;
}

interface Variant {
    id: string;
    name: string;
    price_override?: number | null;
    stock?: number;
}

export function ProductCard({
    product,
    variants = []
}: {
    product: Product;
    variants?: Variant[]
}) {
    const { addToCart } = useCart();

    const activeVariants = (variants || []).filter(v => (v as any).status !== 'draft');
    const mainImage = (product.images && product.images.length > 0)
        ? product.images[0]
        : ((activeVariants.find(v => (v as any).image_url) as any)?.image_url || "/logo.jpg");

    const isOnSale = product.on_sale && product.sale_price;

    // Calculate the lowest price
    let minPrice = isOnSale ? Number(product.sale_price) : Number(product.base_price);

    if (activeVariants.length > 0) {
        const prices = activeVariants
            .map(v => v.price_override != null ? Number(v.price_override) : null)
            .filter((p): p is number => p !== null);

        if (prices.length > 0) {
            const minVarPrice = Math.min(...prices);
            // If base_price is 0 or uninitialized, use the minimum variant price
            if (minPrice <= 0 || minVarPrice < minPrice) {
                minPrice = minVarPrice;
            }
        }
    }


    const hasMultiplePrices = activeVariants.length > 1;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // If has variants, redirect to product page instead of quick add
        if (activeVariants.length > 0) {
            window.location.href = `/product/${product.slug}`;
            return;
        }

        addToCart({
            id: product.id,
            productId: product.id,
            name: product.title,
            price: minPrice,
            image: mainImage,
            quantity: 1,
        });
    };


    return (
        <div className="bg-surface border border-border p-4 md:p-6 group hover:border-primary transition w-full max-w-full">
            <Link href={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden relative">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        {product.is_new && (
                            <span className="bg-white text-black text-[9px] font-bold tracking-[0.2em] px-3 py-1 uppercase">
                                New
                            </span>
                        )}
                        {isOnSale && (
                            <span className="bg-red-600 text-white text-[9px] font-bold tracking-[0.2em] px-3 py-1 uppercase">
                                Sale
                            </span>
                        )}
                        {product.is_bestseller && (
                            <span className="bg-gold text-black text-[9px] font-bold tracking-[0.2em] px-3 py-1 uppercase">
                                Bestseller
                            </span>
                        )}
                    </div>

                    <Image
                        src={mainImage}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                </div>
            </Link>

            <div className="mt-6 space-y-3">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-playfair text-lg tracking-wide text-textPrimary">
                        {product.title}
                    </h3>
                </Link>

                {product.description && (
                    <p className="text-textSecondary text-sm line-clamp-2">
                        {product.description}
                    </p>
                )}

                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-3">
                        {hasMultiplePrices ? (
                            <span className="text-primary font-semibold">
                                Starting from ${minPrice.toFixed(2)}
                            </span>
                        ) : isOnSale ? (
                            <>
                                <span className="text-red-500 font-semibold">
                                    ${Number(product.sale_price).toFixed(2)}
                                </span>
                                <span className="text-textSecondary text-sm line-through opacity-50">
                                    ${Number(product.base_price).toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="text-primary font-semibold">
                                ${minPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleQuickAdd}
                        className="w-full border border-primary px-4 py-3 text-primary text-xs tracking-widest uppercase hover:bg-primary hover:text-black transition"
                    >
                        {activeVariants.length > 0 ? 'Select Options' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
