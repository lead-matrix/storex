"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
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
    const price = product.base_price || 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id: product.id,
            productId: product.id,
            name: product.name,
            price: price,
            image: mainImage,
            quantity: 1,
        });
    };

    return (
        <div className="bg-surface border border-border p-6 group hover:border-primary transition">
            <Link href={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden relative">
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
                    <span className="text-primary font-semibold block mb-3">
                        ${Number(price).toFixed(2)}
                    </span>

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
