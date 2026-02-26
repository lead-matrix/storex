import { ProductCard } from "@/components/ProductCard"

interface FeaturedProductsGridProps {
    products: any[]
    title?: string
    subtitle?: string
}

export function FeaturedProductsGrid({
    products,
    title = "Signature Collection",
    subtitle = "Curated luxury for the modern connoisseur"
}: FeaturedProductsGridProps) {
    if (!products || products.length === 0) return null

    return (
        <section className="section-padding bg-pearl">
            <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="mb-16 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-3xl md:text-4xl font-heading text-charcoal mb-4 tracking-luxury uppercase">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-sm uppercase tracking-luxury text-textsoft">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 w-full stagger-children">
                    {products.slice(0, 8).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}
