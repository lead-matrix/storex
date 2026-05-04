// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — Renders every block type (8 original + 5 new = 13 total)
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
    VideoHeroProps,
    CountdownTimerProps,
    BeforeAfterProps,
    IconGridProps,
    FAQAccordionProps,
} from './types-extended'

// Import new block renderers
import {
    VideoHero,
    CountdownTimer,
    BeforeAfterSlider,
    IconGrid,
    FAQAccordion,
} from './new-blocks-render'

// ──────────────────────────────────────────────────────────────────────────────
// ORIGINAL 8 BLOCK RENDERERS (inline)
// ──────────────────────────────────────────────────────────────────────────────

function HeroBlock({ p }: { p: HeroProps }) {
    return (
        <section
            className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black"
            style={{
                backgroundImage: `url('${p.image_url}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black" style={{ opacity: p.overlay_opacity / 100 }} />
            <div className="relative z-10 text-center text-white px-8 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-serif mb-4 font-bold tracking-tight">
                    {p.heading}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-white/80">
                    {p.subheading}
                </p>
                <button className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.cta_text}
                </button>
            </div>
        </section>
    )
}

function TextBlock({ p }: { p: TextBlockProps }) {
    const textAlign =
        p.align === 'left' ? 'text-left' : p.align === 'right' ? 'text-right' : 'text-center'

    return (
        <section className="py-20 px-8 bg-black">
            <div className={`max-w-2xl ${textAlign} ${p.align === 'center' ? 'mx-auto' : ''}`}>
                {p.eyebrow && (
                    <p className="text-xs uppercase tracking-widest text-gold mb-3 font-bold">
                        {p.eyebrow}
                    </p>
                )}
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 font-bold">
                    {p.heading}
                </h2>
                <p className="text-lg text-white/70 leading-relaxed">{p.body}</p>
            </div>
        </section>
    )
}

function ImageBanner({ p }: { p: ImageBannerProps }) {
    const HEIGHTS: Record<string, string> = {
        sm: 'h-64',
        md: 'h-96',
        lg: 'h-screen',
        full: 'h-screen',
    }

    return (
        <section className={`relative w-full ${HEIGHTS[p.height] ?? 'h-72'} bg-zinc-900 overflow-hidden`}>
            {p.image_url && (
                <img
                    src={p.image_url}
                    alt={p.caption || 'Banner'}
                    className="w-full h-full object-cover"
                />
            )}
            {p.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-6">
                    <p className="text-xl font-serif">{p.caption}</p>
                </div>
            )}
        </section>
    )
}

function ProductShelf({ p }: { p: ProductShelfProps }) {
    return (
        <section className="py-20 px-8 bg-black">
            <div className="max-w-6xl mx-auto">
                {p.heading && (
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-12 text-center font-bold">
                        {p.heading}
                    </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-zinc-800 p-8 rounded">
                    {Array(p.count)
                        .fill(0)
                        .map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-zinc-700 rounded animate-pulse"
                            />
                        ))}
                </div>
            </div>
        </section>
    )
}

function TwoColumn({ p }: { p: TwoColumnProps }) {
    return (
        <section className="flex flex-col md:flex-row w-full">
            {p.image_side === 'left' && p.left_image && (
                <div className="w-full md:w-1/2 h-96 md:h-auto bg-gray-800">
                    <img
                        src={p.left_image}
                        alt="Section"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="w-full md:w-1/2 bg-black text-white flex items-center justify-center p-12">
                <div className="max-w-md">
                    <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                        {p.right_heading}
                    </h3>
                    <p className="text-white/70 mb-8 leading-relaxed">{p.right_body}</p>
                    <button className="border border-white text-white text-xs uppercase tracking-widest px-8 py-3 hover:bg-white hover:text-black transition-all">
                        {p.right_cta_text}
                    </button>
                </div>
            </div>
            {p.image_side === 'right' && p.left_image && (
                <div className="w-full md:w-1/2 h-96 md:h-auto bg-gray-800">
                    <img
                        src={p.left_image}
                        alt="Section"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
        </section>
    )
}

function Newsletter({ p }: { p: NewsletterProps }) {
    return (
        <section className="py-20 px-8 bg-zinc-950 border-t border-zinc-800">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-4 font-bold">
                    {p.heading}
                </h2>
                <p className="text-white/60 mb-8">{p.subheading}</p>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="your@email.com"
                        className="flex-1 px-4 py-3 bg-white text-black rounded"
                    />
                    <button className="bg-gold text-black px-6 py-3 font-bold text-sm uppercase hover:bg-gold/80 rounded transition-all">
                        {p.button_text}
                    </button>
                </div>
            </div>
        </section>
    )
}

function Testimonial({ p }: { p: TestimonialProps }) {
    return (
        <section className="py-20 px-8 bg-zinc-950">
            <div className="max-w-2xl mx-auto text-center">
                <p className="text-2xl md:text-3xl italic text-white mb-8 font-serif">
                    "{p.quote}"
                </p>
                <p className="text-white font-bold">{p.author}</p>
                <p className="text-white/50 text-sm">{p.role}</p>
            </div>
        </section>
    )
}

function Divider({ p }: { p: DividerProps }) {
    return (
        <section className="py-12 px-8 bg-black flex justify-center">
            {p.style === 'line' && <div className="w-24 h-px bg-white/20" />}
            {p.style === 'dots' && (
                <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-white/30" />
                    ))}
                </div>
            )}
            {p.style === 'ornament' && (
                <div className="text-white/30 text-2xl">✦</div>
            )}
        </section>
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN REGISTRY — Routes block type to renderer
// ──────────────────────────────────────────────────────────────────────────────

export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any

    switch (block.type) {
        case 'hero':
            return <HeroBlock p={p} />
        case 'text_block':
            return <TextBlock p={p} />
        case 'image_banner':
            return <ImageBanner p={p} />
        case 'product_shelf':
            return <ProductShelf p={p} />
        case 'two_column':
            return <TwoColumn p={p} />
        case 'newsletter':
            return <Newsletter p={p} />
        case 'testimonial':
            return <Testimonial p={p} />
        case 'divider':
            return <Divider p={p} />
        // NEW BLOCKS
        case 'video_hero':
            return <VideoHero p={p} />
        case 'countdown_timer':
            return <CountdownTimer p={p} />
        case 'before_after':
            return <BeforeAfterSlider p={p} />
        case 'icon_grid':
            return <IconGrid p={p} />
        case 'faq_accordion':
            return <FAQAccordion p={p} />
        default:
            return <div className="p-8 text-center text-white">Unknown block type: {block.type}</div>
    }
}
