import { ProductCard } from "@/components/ProductCard"

interface FeaturedProductsGridProps {
    products: any[]
}

export function FeaturedProductsGrid({
    products
}: FeaturedProductsGridProps) {
    if (!products || products.length === 0) return null

    return (
        <section className="bg-black py-32 md:py-48 relative overflow-hidden">
            {/* AMBIENT GLOW */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gold/5 blur-[160px] rounded-full pointer-events-none" />

            <div className="container-luxury flex flex-col items-center relative z-10">

                {/* SECTION HEADER */}
                <div className="mb-24 text-center space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <p className="text-gold text-[10px] uppercase tracking-[0.5em] font-bold">The Obsidian Selection</p>
                    <h2 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase font-light">
                        Featured <span className="italic">Exclusives</span>
                    </h2>
                    <div className="w-12 h-px bg-gold mx-auto mt-8 opacity-20" />
                </div>

                {/* PRODUCT GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 w-full">
                    {products.slice(0, 4).map((product, idx) => (
                        <div
                            key={product.id}
                            className="animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both"
                            style={{ animationDelay: `${idx * 200}ms` }}
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}
