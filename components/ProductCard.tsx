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
        <div className="bg-[#0f0f0f] rounded-xl border border-white/10 p-4 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group">
            {/* IMAGE CONTAINER */}
            <Link
                href={`/product/${product.slug}`}
                className="relative aspect-square mb-4 overflow-hidden bg-black rounded-lg flex items-center justify-center p-6"
            >
                <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                />
            </Link>

            {/* CONTENT */}
            <div className="flex flex-col flex-grow text-center space-y-3 px-2">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-serif text-[11px] md:text-sm tracking-[0.15em] uppercase text-white transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-[#C6A75E] font-medium tracking-wide text-sm md:text-base">
                    ${Number(price).toFixed(2)}
                </p>

                <div className="pt-2 mt-auto">
                    <button
                        onClick={handleQuickAdd}
                        className="w-full py-2.5 md:py-3 text-[10px] md:text-xs uppercase tracking-widest font-medium border border-[#C6A75E] text-[#C6A75E] hover:bg-[#C6A75E] hover:text-black transition-all duration-300 rounded-lg"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
