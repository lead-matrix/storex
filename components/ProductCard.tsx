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
        <div className="card-premium group flex flex-col h-full animate-in fade-in duration-500">
            {/* IMAGE CONTAINER */}
            <Link
                href={`/product/${product.slug}`}
                className="relative aspect-square mb-6 overflow-hidden bg-black flex items-center justify-center p-8"
            >
                <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain transition-transform duration-700 group-hover:scale-110"
                />
                {/* HOVER OVERLAY */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>

            {/* CONTENT */}
            <div className="flex flex-col flex-grow text-center space-y-3">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-serif text-sm tracking-[0.2em] uppercase text-white hover:text-gold transition-colors line-clamp-1 px-4">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-gold font-medium tracking-wide">
                    ${Number(price).toFixed(2)}
                </p>

                <div className="pt-2 mt-auto">
                    <button
                        onClick={handleQuickAdd}
                        className="btn-outline-gold w-full py-2.5 text-[10px] sm:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
