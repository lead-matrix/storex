import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()
    const { data } = await supabase
        .from('categories')
        .select('name, description')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!data) return { title: 'Category | DINA COSMETIC' }
    return {
        title: `${data.name} | DINA COSMETIC`,
        description: data.description ?? `Shop the ${data.name} collection from DINA COSMETIC.`,
    }
}

export default async function CategorySlugPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch category
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!category) notFound()

    // Fetch active products: featured first, then newest
    const { data: products } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('is_active', true)
        .eq('category_id', category.id)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

    const items = products ?? []

    return (
        <div className="min-h-screen bg-white">

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-6 pt-8">
                <nav className="flex items-center gap-2 text-[9px] uppercase tracking-luxury text-textsoft/60 font-medium">
                    <Link href="/" className="hover:text-gold transition-colors">Home</Link>
                    <ArrowRight size={8} />
                    <Link href="/collections" className="hover:text-gold transition-colors">Collections</Link>
                    <ArrowRight size={8} />
                    <span className="text-charcoal">{category.name}</span>
                </nav>
            </div>

            {/* Hero */}
            <div className="relative pt-12 pb-16 px-6 overflow-hidden">
                {category.image_url && (
                    <div className="absolute inset-0">
                        <Image
                            src={category.image_url}
                            alt={category.name}
                            fill
                            className="object-cover opacity-10"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white" />
                    </div>
                )}
                {/* Subtle gold glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] opacity-[0.08] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, #C6A85C, transparent 70%)' }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-px bg-gold/40" />
                            <p className="text-[9px] uppercase tracking-luxury text-gold/80 font-medium">DINA COSMETIC Collection</p>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-heading text-charcoal tracking-luxury">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-sm text-textsoft leading-relaxed max-w-md">
                                {category.description}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-textsoft/60 uppercase tracking-luxury pt-1">
                            <Tag size={10} className="text-gold" />
                            <span>{items.length} {items.length === 1 ? 'product' : 'products'}</span>
                            <div className="w-8 h-px bg-charcoal/10" />
                            <span>Curated Selection</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-32">
                {items.length === 0 ? (
                    <div className="text-center py-24 space-y-6">
                        <p className="text-textsoft uppercase tracking-luxury text-[10px]">
                            No products in this collection yet.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-3 border border-charcoal/20 text-charcoal px-8 py-4 text-[10px] uppercase tracking-luxury rounded-full hover:border-gold hover:text-gold hover:bg-gold/5 transition-all shadow-sm"
                        >
                            Browse All Products <ArrowRight size={11} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((product) => {
                            const activeVariants = (product.variants as Array<{
                                id: string; name: string; price_override: number | null;
                                stock: number; is_active: boolean
                            }>)?.filter(v => v.is_active) ?? []

                            const displayPrice = activeVariants.length > 0
                                ? Math.min(...activeVariants.map(v => v.price_override ?? (product as any).base_price))
                                : (product as any).base_price

                            const image = product.images?.[0]

                            return (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group bg-white rounded-luxury shadow-soft border border-charcoal/8 overflow-hidden hover:shadow-luxury hover:border-gold/20 transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-square bg-pearl overflow-hidden">
                                        {image ? (
                                            <Image
                                                src={image}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-champagne/50" />
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                            {product.is_featured && (
                                                <span className="bg-gold text-white text-[8px] font-medium uppercase tracking-luxury px-2 py-0.5 rounded-full shadow-sm">
                                                    Featured
                                                </span>
                                            )}
                                            {product.is_bestseller && (
                                                <span className="bg-charcoal text-pearl text-[8px] font-medium uppercase tracking-luxury px-2 py-0.5 rounded-full shadow-sm">
                                                    Bestseller
                                                </span>
                                            )}
                                        </div>

                                        {/* Variant count badge */}
                                        {activeVariants.length > 0 && (
                                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-charcoal text-[8px] uppercase tracking-luxury font-medium px-2 py-1 rounded-full shadow-sm">
                                                {activeVariants.length} shades
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 space-y-2">
                                        <h2 className="font-heading text-charcoal text-sm tracking-luxury group-hover:text-gold transition-colors leading-tight">
                                            {product.name}
                                        </h2>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-charcoal">
                                                {activeVariants.length > 1 ? 'From ' : ''}
                                                ${displayPrice.toFixed(2)}
                                            </span>
                                            <ArrowRight size={12} className="text-textsoft/40 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
