import React from 'react'
import Link from 'next/link'

export interface ProductGridProps {
    collection?: string
}

export default function ProductGrid({ collection }: ProductGridProps) {
    // In a real implementation we'd fetch products by collection ID or slug.
    // For the visual builder, we'll placeholder this.
    return (
        <section className="py-20 bg-white dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <h2 className="text-3xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight">
                        {collection || "Featured"} Collection
                    </h2>
                    <Link href="/shop" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors uppercase tracking-widest text-sm">
                        View All
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="group">
                            <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Product Placeholder</span>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Demo Product {i}</h3>
                                    <p className="mt-1 text-sm text-zinc-500">{collection || "Demo"} Category</p>
                                </div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">$85.00</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
