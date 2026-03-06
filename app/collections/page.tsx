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
            index: i,
        }))
        : fallbackCollections.map((c, i) => ({ ...c, index: i }))

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {displayItems.map((col, i) => {
                        const href = col.slug ? `/collections/${col.slug}` : '/shop'
                        return (
                            <Link
                                key={col.id}
                                href={href}
                                className="group relative border border-gold-primary/8 bg-background-secondary/30 p-10 space-y-10 hover:border-gold-primary/25 transition-all duration-700 overflow-hidden gold-glow-hover block"
                            >
                                {/* Roman numeral watermark */}
                                <div className="absolute top-6 right-8 text-[40px] font-serif text-gold-primary/4 group-hover:text-gold-primary/8 transition-colors duration-700 pointer-events-none select-none">
                                    {romanNumerals[i] || (i + 1).toString()}
                                </div>

                                <div className="relative z-10 space-y-5">
                                    {/* Gold accent dot */}
                                    <div className="w-5 h-[1px] bg-gold-primary/30 group-hover:w-10 transition-all duration-500" />

                                    <div>
                                        <h3 className="text-[9px] uppercase tracking-[0.35em] text-text-mutedDark/50 mb-3">
                                            {col.subtitle}
                                        </h3>
                                        <h2 className="text-3xl font-serif text-text-headingDark tracking-tight">
                                            {col.name}
                                        </h2>
                                    </div>

                                    <p className="text-[10px] text-text-mutedDark/50 leading-loose uppercase tracking-widest font-light line-clamp-3">
                                        {col.description}
                                    </p>

                                    <div className="flex items-center gap-3 text-gold-primary uppercase text-[9px] tracking-[0.4em] pt-6 group-hover:gap-5 transition-all duration-500">
                                        {col.slug ? 'Explore Vault' : 'View Collection'}
                                        <ArrowRight size={12} />
                                    </div>
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

