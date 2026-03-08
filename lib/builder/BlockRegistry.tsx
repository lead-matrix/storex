'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — renders every block type as a real, styled preview.
// This is the single source of truth used in both the canvas and public pages.
// ─────────────────────────────────────────────────────────────────────────────

import {
    PageBlock,
    HeroProps,
    TextBlockProps,
    ImageBannerProps,
    ProductShelfProps,
    TwoColumnProps,
    NewsletterProps,
    DividerProps,
    TestimonialProps,
} from '@/lib/builder/types'

// ── Helpers ──────────────────────────────────────────────────────────────────
const ALIGN = { left: 'text-left items-start', center: 'text-center items-center', right: 'text-right items-end' }

// ── Hero ─────────────────────────────────────────────────────────────────────
function HeroBlock({ p }: { p: HeroProps }) {
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {p.image_url
                ? <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
            }
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(p.overlay_opacity ?? 50) / 100})` }} />
            <div className="relative z-10 text-center px-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
                <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest leading-tight">{p.heading}</h1>
                <p className="text-sm text-white/70 uppercase tracking-[0.25em] max-w-xl leading-relaxed">{p.subheading}</p>
                <a href={p.cta_link}
                    className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.cta_text}
                </a>
            </div>
        </section>
    )
}

// ── Text Block ────────────────────────────────────────────────────────────────
function TextBlock({ p }: { p: TextBlockProps }) {
    const cls = ALIGN[p.align] ?? ALIGN.center
    return (
        <section className="py-20 px-8 bg-black">
            <div className={`max-w-3xl mx-auto flex flex-col ${cls} gap-4`}>
                {p.eyebrow && <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">{p.eyebrow}</span>}
                <h2 className="text-3xl md:text-5xl font-serif text-white tracking-wide">{p.heading}</h2>
                <p className="text-white/60 text-base leading-relaxed max-w-prose">{p.body}</p>
            </div>
        </section>
    )
}

// ── Image Banner ──────────────────────────────────────────────────────────────
const HEIGHTS = { sm: 'h-48', md: 'h-72', lg: 'h-[50vh]', full: 'h-screen' }
function ImageBannerBlock({ p }: { p: ImageBannerProps }) {
    return (
        <section className={`relative w-full ${HEIGHTS[p.height] ?? 'h-72'} bg-zinc-900 overflow-hidden`}>
            {p.image_url
                ? <img src={p.image_url} alt={p.caption} className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">Add an image URL in settings</div>
            }
            {p.caption && (
                <div className="absolute bottom-0 left-0 right-0 py-3 px-6 bg-black/50 backdrop-blur-sm">
                    <p className="text-white/70 text-xs uppercase tracking-widest text-center">{p.caption}</p>
                </div>
            )}
        </section>
    )
}

// ── Product Shelf ─────────────────────────────────────────────────────────────
function ProductShelfBlock({ p }: { p: ProductShelfProps }) {
    // Canvas preview — real data loads on the public page via route
    const placeholders = Array.from({ length: Math.min(p.count, 4) })
    return (
        <section className="py-16 px-8 bg-black">
            <h2 className="text-center text-2xl font-serif text-white tracking-widest mb-10">{p.heading}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                {placeholders.map((_, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 aspect-[3/4] flex flex-col items-center justify-center gap-3 text-white/20 rounded">
                        <span className="text-2xl">🛍️</span>
                        <span className="text-[9px] uppercase tracking-widest">Product {i + 1}</span>
                    </div>
                ))}
            </div>
            <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest">Live products will appear here — filter: {p.filter}</p>
        </section>
    )
}

// ── Two Column ────────────────────────────────────────────────────────────────
function TwoColumnBlock({ p }: { p: TwoColumnProps }) {
    const img = (
        <div className="flex-1 min-h-[300px] bg-zinc-900 relative overflow-hidden">
            {p.left_image
                ? <img src={p.left_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">Image URL</div>
            }
        </div>
    )
    const text = (
        <div className="flex-1 bg-black py-16 px-10 flex flex-col justify-center gap-5">
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-wide">{p.right_heading}</h2>
            <p className="text-white/60 leading-relaxed text-sm">{p.right_body}</p>
            <a href={p.right_cta_link} className="self-start border border-[#D4AF37] text-[#D4AF37] text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#D4AF37] hover:text-black transition-all">
                {p.right_cta_text}
            </a>
        </div>
    )
    return (
        <section className="flex flex-col md:flex-row w-full">
            {p.image_side === 'left' ? <>{img}{text}</> : <>{text}{img}</>}
        </section>
    )
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function NewsletterBlock({ p }: { p: NewsletterProps }) {
    return (
        <section className="py-20 px-8 bg-zinc-950 border-t border-zinc-800">
            <div className="max-w-lg mx-auto text-center flex flex-col items-center gap-5">
                <h2 className="text-2xl md:text-3xl font-serif text-white tracking-widest">{p.heading}</h2>
                <p className="text-white/50 text-sm leading-relaxed">{p.subheading}</p>
                <div className="flex gap-0 w-full max-w-sm">
                    <input readOnly placeholder="your@email.com" className="flex-1 bg-transparent border border-white/20 px-4 py-2.5 text-white text-xs outline-none placeholder:text-white/30" />
                    <button className="bg-[#D4AF37] text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shrink-0">{p.button_text}</button>
                </div>
            </div>
        </section>
    )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function DividerBlock({ p }: { p: DividerProps }) {
    if (p.style === 'line') return <div className="py-4 px-8"><div className="border-t border-white/10" /></div>
    if (p.style === 'dots') return <div className="py-6 flex justify-center gap-3"><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /><span className="w-1 h-1 rounded-full bg-[#D4AF37]" /></div>
    return <div className="py-8 flex justify-center"><span className="text-[#D4AF37] text-lg tracking-[0.5em]">✦ ✦ ✦</span></div>
}

// ── Testimonial ───────────────────────────────────────────────────────────────
function TestimonialBlock({ p }: { p: TestimonialProps }) {
    return (
        <section className="py-20 px-8 bg-zinc-950">
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
                <span className="text-[#D4AF37] text-4xl font-serif">"</span>
                <p className="text-white text-xl font-serif italic leading-relaxed tracking-wide">{p.quote}</p>
                <div className="w-10 border-t border-[#D4AF37]" />
                <div>
                    <p className="text-white font-medium text-sm uppercase tracking-widest">{p.author}</p>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">{p.role}</p>
                </div>
            </div>
        </section>
    )
}

// ── Public entry point ────────────────────────────────────────────────────────
export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any
    switch (block.type) {
        case 'hero': return <HeroBlock p={p} />
        case 'text_block': return <TextBlock p={p} />
        case 'image_banner': return <ImageBannerBlock p={p} />
        case 'product_shelf': return <ProductShelfBlock p={p} />
        case 'two_column': return <TwoColumnBlock p={p} />
        case 'newsletter': return <NewsletterBlock p={p} />
        case 'divider': return <DividerBlock p={p} />
        case 'testimonial': return <TestimonialBlock p={p} />
        default: return null
    }
}
