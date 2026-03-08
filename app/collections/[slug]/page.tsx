import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('name, description').eq('slug', slug).single()
    if (!data) return { title: 'Collection | DINA COSMETIC' }
    return {
        title: `${data.name} | DINA COSMETIC`,
        description: data.description ?? `Shop the ${data.name} collection.`,
    }
}

export default async function CollectionSlugPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: category } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url')
        .eq('slug', slug)
        .single()

    if (!category) notFound()

    const { data: products } = await supabase
        .from('products')
        .select('id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, is_featured, product_variants(id, name, price_override, stock, status)')
        .eq('status', 'active')
        .eq('category_id', category.id)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

    const items = products ?? []

    return (
        <div className="bg-[#050505] text-white/80 min-h-screen">

            {/* Hero */}
            <div className="relative pt-36 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-[0.04]"
                        style={{ background: 'radial-gradient(ellipse, rgb(212 175 55), transparent 70%)' }} />
                </div>
                {category.image_url && (
                    <div className="absolute inset-0">
                        <Image src={category.image_url} alt={category.name} fill className="object-cover opacity-10" priority />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/70 to-[#050505]" />
                    </div>
                )}
                <div className="max-w-7xl mx-auto relative z-10">
                    <nav className="flex items-center gap-2 text-[9px] uppercase tracking-[0.35em] text-white/20 mb-10">
                        <Link href="/" className="hover:text-[#D4AF37]/60 transition-colors">Home</Link>
                        <ArrowRight size={8} />
                        <Link href="/collections" className="hover:text-[#D4AF37]/60 transition-colors">Collections</Link>
                        <ArrowRight size={8} />
                        <span className="text-[#D4AF37]/50">{category.name}</span>
                    </nav>
                    <div className="space-y-4 max-w-2xl">
                        <p className="text-[9px] uppercase tracking-[0.55em] text-[#D4AF37]/50 font-light">The Obsidian Palace</p>
                        <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white/92">{category.name}</h1>
                        {category.description && (
                            <p className="text-[11px] uppercase tracking-widest text-white/30 leading-loose font-light max-w-md">{category.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-widest pt-2">
                            <span>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span>
                            <div className="w-8 h-px bg-[#D4AF37]/20" />
                            <span>Curated Selection</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-32">
                {items.length === 0 ? (
                    <div className="text-center py-24 space-y-6">
                        <p className="text-white/20 uppercase tracking-[0.5em] text-[10px]">This vault is sealed. No products yet.</p>
                        <Link href="/shop" id="collection-empty-shop"
                            className="inline-flex items-center gap-3 border border-[#D4AF37]/25 text-[#D4AF37]/70 px-8 py-4 text-[9px] uppercase tracking-[0.4em] hover:bg-[#D4AF37]/5 transition-all min-h-[44px]">
                            Browse All Products <ArrowRight size={11} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                        {items.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product as any}
                                variants={(product.product_variants as any[]) ?? []}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

