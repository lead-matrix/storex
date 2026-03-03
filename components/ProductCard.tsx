"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number | null;
    on_sale?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
    images: string[];
    description?: string;
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

    const mainImage = product.images?.[0] || "/logo.jpg";
    const isOnSale = product.on_sale && product.sale_price;
    const currentPrice = isOnSale ? Number(product.sale_price) : Number(product.base_price);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id: product.id,
            productId: product.id,
            name: product.name,
            price: currentPrice,
            image: mainImage,
            quantity: 1,
        });
    };


    return (
        <div className="bg-surface border border-border p-6 group hover:border-primary transition">
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
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                </div>
            </Link>

            <div className="mt-6 space-y-3">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-playfair text-lg tracking-wide text-textPrimary">
                        {product.name}
                    </h3>
                </Link>

                {product.description && (
                    <p className="text-textSecondary text-sm line-clamp-2">
                        {product.description}
                    </p>
                )}

                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-3">
                        {isOnSale ? (
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
                                ${Number(product.base_price).toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleQuickAdd}
                        className="w-full border border-primary px-4 py-3 text-primary text-xs tracking-widest uppercase hover:bg-primary hover:text-black transition"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
