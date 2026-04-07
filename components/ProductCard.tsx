"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Star, Eye } from "lucide-react";
import { toast } from "sonner";

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
  color_code?: string | null;
  image_url?: string | null;
  status?: string;
}

export function ProductCard({
  product,
  variants = [],
  isPriority = false,
}: {
  product: Product;
  variants?: Variant[];
  isPriority?: boolean;
}) {
  const { addToCart } = useCart();
  const [hoveredVariant, setHoveredVariant] = useState<Variant | null>(null);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const activeVariants = (variants || []).filter(v => (v as any).status !== "draft");
  const colorVariants = activeVariants.filter(v => v.color_code);
  const displayVariants = colorVariants.slice(0, 5);
  const extraCount = colorVariants.length - 5;

  const displayImage = hoveredVariant?.image_url
    || (imageError ? "/logo.jpg" : (product.images?.[0] || "/logo.jpg"));

  const isOnSale = product.on_sale && product.sale_price;

  let minPrice = Number(product.base_price || 0);
  if (activeVariants.length > 0) {
    const prices = activeVariants
      .map(v => v.price_override != null ? Number(v.price_override) : Number(product.base_price))
      .filter(p => !isNaN(p) && p > 0);
    if (prices.length > 0) minPrice = Math.min(...prices);
  }
  const salePrice = isOnSale ? Number(product.sale_price) : null;
  const displayPrice = salePrice ?? minPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeVariants.length > 0) {
      window.location.href = `/product/${product.slug}`;
      return;
    }

    setAdding(true);
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.title,
      price: displayPrice,
      image: product.images?.[0] || "/logo.jpg",
      quantity: 1,
    });
    toast.success("Added to bag", { description: product.title });
    setTimeout(() => setAdding(false), 1000);
  };

  // Mock review count — replace with real data when reviews table exists
  const reviewCount = Math.floor(Math.abs(parseInt(product.id?.slice(-3), 16) || 0) % 80) + 12;
  const rating = 4.7 + (parseInt(product.id?.slice(-1), 16) % 3) * 0.1;

  return (
    <div className="group relative bg-white border border-[#1A1A1A]/8 rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-xl transition-all duration-300">

      {/* Image container */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <div className="relative aspect-square bg-[#FAFAF8] overflow-hidden">
          <Image
            src={displayImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority={isPriority}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_new && (
              <span className="bg-white text-[#1A1A1A] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                NEW
              </span>
            )}
            {isOnSale && (
              <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                SALE
              </span>
            )}
            {product.is_bestseller && (
              <span className="bg-[#D4AF37] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                BESTSELLER
              </span>
            )}
          </div>

          {/* Hover overlay with quick add */}
          <div className="absolute inset-0 bg-[#1A1A1A]/0 group-hover:bg-[#1A1A1A]/10 transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-2 bg-white text-[#1A1A1A] px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xl hover:bg-[#D4AF37] hover:text-white transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {activeVariants.length > 0 ? "Select Shade" : adding ? "Added!" : "Quick Add"}
            </button>
          </div>

          {/* Variant count bubble */}
          {activeVariants.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[9px] uppercase tracking-wide font-bold px-2 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {activeVariants.length} shades
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="p-4 space-y-3">

        {/* Color swatches */}
        {displayVariants.length > 0 && (
          <div className="flex items-center gap-1.5">
            {displayVariants.map((v) => (
              <button
                key={v.id}
                onMouseEnter={() => setHoveredVariant(v)}
                onMouseLeave={() => setHoveredVariant(null)}
                onClick={() => window.location.href = `/product/${product.slug}`}
                title={v.name}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 hover:scale-125 ${
                  hoveredVariant?.id === v.id ? "border-[#1A1A1A] scale-125" : "border-white shadow-sm"
                }`}
                style={{ backgroundColor: v.color_code || "#ccc" }}
              />
            ))}
            {extraCount > 0 && (
              <span className="text-[10px] text-[#4A4A4A]/60 font-medium">+{extraCount}</span>
            )}
          </div>
        )}

        {/* Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-bold text-[#1A1A1A] leading-tight hover:text-[#D4AF37] transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= Math.floor(rating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-200 fill-gray-200"}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#4A4A4A]/60">({reviewCount})</span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-base font-bold text-red-500">${salePrice.toFixed(2)}</span>
                <span className="text-sm text-[#4A4A4A]/40 line-through">${minPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base font-bold text-[#1A1A1A]">
                {activeVariants.length > 1 ? "From " : ""}${displayPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="w-8 h-8 rounded-full bg-[#F5F1EB] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition-all group/btn"
          >
            <Eye className="w-3.5 h-3.5 text-[#1A1A1A] group-hover/btn:text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}
