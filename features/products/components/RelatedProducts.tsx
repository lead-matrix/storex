import { ProductCard } from "@/components/ProductCard"

interface RelatedProductsProps {
    products: any[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
    if (!products || products.length === 0) return null

    return (
        <section className="section-padding bg-white border-t border-charcoal/5">
            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="mb-12 w-full text-center">
                    <h2 className="text-2xl md:text-3xl font-heading text-charcoal mb-2 tracking-luxury">
                        Complete The Ritual
                    </h2>
                    <div className="w-12 h-px bg-gold/50 mx-auto mt-4" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 w-full stagger-children">
                    {products.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}
