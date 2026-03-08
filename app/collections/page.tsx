import { createClient } from '@/lib/supabase/server'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
    title: "Collections | DINA COSMETIC",
    description: "Discover curated beauty sets and seasonal highlights from the Obsidian Palace.",
}

export default async function CollectionsPage() {
    const supabase = await createClient()

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url')
        .order('name')

    // Fallback static collections if no categories exist yet
    const fallbackCollections = [
        {
            id: 'obsidian-core',
            name: 'Obsidian Core',
            slug: null,
            subtitle: 'The Foundation of Luxury',
            description: 'Essential pieces formulated with absolute black minerals and liquid gold.',
        },
        {
            id: 'royal-crimson',
            name: 'Royal Crimson',
            slug: null,
            subtitle: 'Limited Edition Lips',
            description: 'Hand-crafted lip masterpieces for the inner circle.',
        },
        {
            id: 'palace-gold',
            name: 'Palace Gold',
            slug: null,
            subtitle: 'The Highlight Series',
            description: 'Refracted light captured in weighted artisan glass.',
        },
    ]

    const displayItems = categories && categories.length > 0
        ? categories.map((cat, i) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            subtitle: cat.description ? cat.description.split('.')[0] : 'Curated Experience',
            description: cat.description || 'Luxury beauty crafted for the discerning collector.',
            image: cat.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
            index: i,
        }))
        : fallbackCollections.map((c, i) => ({ ...c, image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=800&q=80', index: i }))

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI']

    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen">

            {/* ── Hero Header ── */}
            <div className="relative pt-40 pb-24 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.035]"
                        style={{ background: 'radial-gradient(ellipse, rgb(212 175 55), transparent 70%)' }}
                    />
                </div>
                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
                    <p className="text-[9px] uppercase tracking-[0.6em] text-gold-primary/60 font-light">
                        The Obsidian Palace
                    </p>
                    <h1 className="text-6xl md:text-9xl font-serif italic tracking-tighter text-text-headingDark">
                        Vaults
                    </h1>
                    <p className="text-gold-primary/60 uppercase tracking-[0.5em] text-[10px] font-light max-w-md mx-auto">
                        Curated experiences extracted from the palace archives.
                    </p>
                </div>
            </div>

            {/* ── Collections Grid ── */}
            <div className="px-6 max-w-7xl mx-auto pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayItems.map((col, i) => {
                        const href = col.slug ? `/collections/${col.slug}` : `/shop?category=${col.slug || col.id}`
                        return (
                            <Link
                                key={col.id}
                                href={href}
                                className="group relative aspect-[4/5] overflow-hidden block"
                            >
                                {/* Background Image (The Circular Image from Supabase) */}
                                <img
                                    src={col.image}
                                    alt={col.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                                {/* Text Content */}
                                <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-2xl font-serif italic text-white tracking-widest uppercase mb-2">
                                        {col.name}
                                    </h3>
                                    <p className="text-xs text-gold-primary uppercase tracking-[0.2em] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        {col.slug ? 'Explore Vault' : 'View Collection'} &rarr;
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* ── Shop All CTA ── */}
                <div className="mt-20 pt-16 border-t border-gold-primary/8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.5em] text-text-mutedDark/30 mb-8">
                        Can&apos;t decide? Browse everything
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-3 border border-gold-primary/25 text-gold-primary px-10 py-4 text-[10px] uppercase tracking-[0.4em] hover:bg-gold-primary/5 transition-all duration-300"
                    >
                        The Full Boutique <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

        </div>
    )
}

