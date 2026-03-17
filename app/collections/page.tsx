import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'

export const revalidate = 60

export const metadata: Metadata = {
    title: "Collections | DINA COSMETIC",
    description: "Discover curated beauty collections from The Radiant Atelier.",
}

export default async function CollectionsPage() {
    const supabase = await createClient()

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, product_count:products(count)')
        .order('name')

    const displayItems = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || 'Luxury beauty crafted for the discerning collector.',
            image: cat.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
            count: cat.product_count?.[0]?.count || 0,
            index: i,
        }))
        : []

    return (
        <div className="bg-black text-white min-h-screen selection:bg-gold/30">

            {/* ── Radiant Header ── */}
            <div className="relative pt-48 pb-32 px-6 overflow-hidden border-b border-white/5 bg-obsidian">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-50" />
                
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] opacity-10 blur-[120px] bg-gradient-to-br from-gold/20 via-transparent to-purple-900/10 animate-pulse" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10 text-center space-y-10">
                    <div className="flex flex-col items-center gap-6 animate-luxury-fade" style={{ animationDelay: '0.2s' }}>
                        <div className="w-12 h-px bg-gold/40" />
                        <p className="text-[10px] uppercase tracking-[0.8em] text-gold/80 font-medium">
                            The Radiant Atelier
                        </p>
                        <div className="w-12 h-px bg-gold/40" />
                    </div>

                    <h1 className="text-7xl md:text-[10rem] font-serif tracking-tighter text-white leading-[0.85] italic opacity-95">
                        Essence
                    </h1>
                    
                    <div className="max-w-xl mx-auto space-y-8 pt-4">
                        <p className="text-white/40 uppercase tracking-[0.4em] text-[11px] font-light leading-relaxed italic">
                            A curated selection of olfactory and aesthetic masterpieces, <br />
                            archived for those who appreciate the finer rituals.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Collections Showcase Grid ── */}
            <section className="px-6 py-32 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
                    {displayItems.map((col, i) => {
                        const href = col.slug ? `/category/${col.slug}` : `/shop?category=${col.id}`
                        
                        // Alternating Grid Logic for Visual Hierarchy
                        const isFeatured = i === 1 || i === 4;

                        return (
                            <Link
                                key={col.id}
                                href={href}
                                className={`group relative block transition-all duration-700 ${isFeatured ? 'lg:translate-y-20' : ''}`}
                            >
                                <div className="relative aspect-[3/4] overflow-hidden bg-white/5 border border-white/5 group-hover:border-gold/30 transition-colors duration-700">
                                    {/* Image with Parallax-esque zoom */}
                                    <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110">
                                         <img
                                            src={col.image}
                                            alt={col.name}
                                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>

                                    {/* Luxury Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                                    
                                    {/* Content (Bottom Left) */}
                                    <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gold text-[10px] font-serif italic tracking-widest opacity-80">
                                                Registry {i + 1}
                                            </span>
                                            <div className="w-6 h-px bg-gold/30" />
                                        </div>
                                        
                                        <h3 className="text-4xl font-serif text-white tracking-tight leading-tight group-hover:tracking-wider transition-all duration-700">
                                            {col.name}
                                        </h3>

                                        <div className="flex items-center gap-4 pt-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 delay-100">
                                            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Discover</span>
                                            <ArrowRight className="w-3 h-3 text-gold" strokeWidth={1.5} />
                                        </div>
                                    </div>

                                    {/* Product Count Badge (Top Right) */}
                                    <div className="absolute top-8 right-8 flex flex-col items-end gap-1">
                                        <span className="text-[14px] font-serif italic text-gold">{col.count}</span>
                                        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40">Assets</span>
                                    </div>
                                </div>
                                
                                <div className="mt-8 space-y-2 px-2 max-w-[90%]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 leading-relaxed italic line-clamp-2 font-light">
                                        "{col.description}"
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* ── Empty State ── */}
                {displayItems.length === 0 && (
                    <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                         <Sparkles className="w-12 h-12 text-gold animate-luxury-pulse" strokeWidth={0.5} />
                         <p className="text-[10px] uppercase tracking-[0.6em] text-white">The Archivist is currently cataloging new collections...</p>
                         <Link href="/shop" className="text-gold border-b border-gold/30 py-2 text-xs uppercase tracking-widest hover:text-white transition-colors">Return to Boutique</Link>
                    </div>
                )}

                {/* ── Bottom Navigation ── */}
                <div className="mt-60 pt-20 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12">
                   <div className="space-y-4 text-center lg:text-left">
                        <h2 className="text-2xl font-serif italic text-white/90">Curate Your Vanishing Palette</h2>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 font-light">Bespoke selections for the modern ritualist.</p>
                   </div>
                   
                    <Link
                        href="/shop"
                        className="group flex items-center gap-8 bg-gold text-black px-16 py-6 text-[10px] uppercase tracking-[0.6em] font-bold hover:shadow-[0_0_80px_rgba(212,175,55,0.2)] hover:bg-white transition-all duration-700"
                    >
                        Browse All Assets
                        <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-2" />
                    </Link>
                </div>
            </section>
        </div>
    )
}
