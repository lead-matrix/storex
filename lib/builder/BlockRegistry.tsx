'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — renders every block type as a real, styled preview
// Updated: +5 new blocks (video_hero, countdown_timer, before_after, icon_grid, faq_accordion)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
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
    FaqAccordionProps,
} from '@/lib/builder/types'

const ALIGN = { left: 'text-left items-start', center: 'text-center items-center', right: 'text-right items-end' }

// ── Hero ──────────────────────────────────────────────────────────────────────
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
                <a href={p.cta_link} className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.cta_text}
                </a>
            </div>
        </section>
    )
}

// ── Video Hero ────────────────────────────────────────────────────────────────
function VideoHeroBlock({ p }: { p: VideoHeroProps }) {
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {p.video_url ? (
                <video
                    src={p.video_url}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest">Add video URL in settings</span>
                </div>
            )}
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(p.overlay_opacity ?? 40) / 100})` }} />
            <div className="relative z-10 text-center px-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
                <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest leading-tight">{p.heading}</h1>
                <p className="text-sm text-white/70 uppercase tracking-[0.25em] max-w-xl leading-relaxed">{p.subheading}</p>
                <a href={p.cta_link} className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.cta_text}
                </a>
            </div>
        </section>
    )
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimerBlock({ p }: { p: CountdownTimerProps }) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const tick = () => {
            const end = new Date(p.end_date).getTime()
            const now = new Date().getTime()
            const diff = Math.max(0, end - now)

            if (diff <= 0) {
                setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
                return
            }

            setTime({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [p.end_date])

    if (!mounted) return <section className="h-64 bg-black" />

    return (
        <section className="relative w-full bg-gradient-to-br from-black via-gray-900 to-black py-20 px-8">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">{p.heading}</h2>
                <p className="text-[#D4AF37] text-lg font-light mb-12">{p.message}</p>

                <div className="grid grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
                    {[
                        { label: 'Days', value: time.days },
                        { label: 'Hours', value: time.hours },
                        { label: 'Mins', value: time.minutes },
                        { label: 'Secs', value: time.seconds },
                    ].map((unit) => (
                        <div key={unit.label} className="bg-white/5 border border-[#D4AF37]/30 rounded-lg p-4 backdrop-blur-sm hover:border-[#D4AF37]/60 transition-colors">
                            <div className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2 font-mono">
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            <div className="text-xs uppercase tracking-widest text-white/60">{unit.label}</div>
                        </div>
                    ))}
                </div>

                <a href={p.cta_link} className="inline-block bg-[#D4AF37] text-black font-bold uppercase tracking-[0.2em] px-12 py-4 hover:bg-[#D4AF37]/80 transition-all duration-300 rounded-sm">
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
                : <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">Add image URL</div>
            }
            {p.caption && (
                <div className="absolute bottom-0 left-0 right-0 py-3 px-6 bg-black/50 backdrop-blur-sm">
                    <p className="text-white/70 text-xs uppercase tracking-widest text-center">{p.caption}</p>
                </div>
            )}
        </section>
    )
}

// ── Before / After ────────────────────────────────────────────────────────────
function BeforeAfterBlock({ p }: { p: BeforeAfterProps }) {
    const [sliderPos, setSliderPos] = useState(50)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)

    const move = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
        setSliderPos(pct)
    }

    return (
        <section className="py-16 px-8 bg-black">
            {p.caption && (
                <h2 className="text-center text-2xl md:text-3xl font-serif text-white tracking-widest mb-10">{p.caption}</h2>
            )}
            <div
                ref={containerRef}
                className="relative max-w-3xl mx-auto aspect-[16/9] overflow-hidden rounded cursor-col-resize select-none bg-zinc-900"
                onMouseDown={() => { dragging.current = true }}
                onMouseUp={() => { dragging.current = false }}
                onMouseLeave={() => { dragging.current = false }}
                onMouseMove={e => { if (dragging.current) move(e.clientX) }}
                onTouchMove={e => move(e.touches[0].clientX)}
            >
                {/* After image (full) */}
                {p.after_image
                    ? <img src={p.after_image} alt={p.label_after} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">{p.label_after}</div>
                }
                {/* Before image (clipped) */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    {p.before_image
                        ? <img src={p.before_image} alt={p.label_before} className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
                        : <div className="absolute inset-0 bg-zinc-700 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">{p.label_before}</div>
                    }
                </div>
                {/* Slider handle */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                        <span className="text-black text-xs font-bold select-none">↔</span>
                    </div>
                </div>
                {/* Labels */}
                <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded">{p.label_before}</span>
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded">{p.label_after}</span>
            </div>
        </section>
    )
}

// ── Icon Grid ─────────────────────────────────────────────────────────────────
function IconGridBlock({ p }: { p: IconGridProps }) {
    return (
        <section className="w-full bg-black py-20 px-8 border-y border-white/10">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif text-white text-center mb-16">{p.heading}</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {p.items.map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center group hover:bg-white/5 p-6 rounded-lg transition-all duration-300">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">{item.label}</h3>
                            <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function FaqAccordionBlock({ p }: { p: FaqAccordionProps }) {
    const [open, setOpen] = useState<number | null>(0)

    return (
        <section className="w-full bg-black py-20 px-8">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-serif text-white text-center mb-16">{p.heading}</h2>

                <div className="space-y-3">
                    {p.items.map((item, i) => (
                        <div key={i} className="border border-white/10 rounded-lg overflow-hidden hover:border-[#D4AF37]/30 transition-colors">
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                            >
                                <h3 className="text-left text-white font-medium">{item.question}</h3>
                                <span className="text-[#D4AF37] text-xl transition-transform duration-300" style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    ▼
                                </span>
                            </button>

                            {open === i && (
                                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/10">
                                    <p className="text-white/70 text-sm leading-relaxed">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ── Product Shelf ─────────────────────────────────────────────────────────────
function ProductShelfBlock({ p }: { p: ProductShelfProps }) {
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
            <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest">Live products — filter: {p.filter}</p>
        </section>
    )
}

// ── Two Column ────────────────────────────────────────────────────────────────
function TwoColumnBlock({ p }: { p: TwoColumnProps }) {
    const img = p.image_side === 'left' ? p.left_image : p.right_image ?? p.left_image
    const noImg = p.image_side === 'left' ? !p.left_image : !(p.right_image ?? p.left_image)
    return (
        <section className="flex flex-col md:flex-row w-full">
            {p.image_side === 'left' && (
                <div className="md:w-1/2 h-64 md:h-auto bg-zinc-900 flex items-center justify-center">
                    {p.left_image ? <img src={p.left_image} alt="" className="w-full h-full object-cover" /> : <span className="text-white/20 text-xs uppercase tracking-widest">Add left image</span>}
                </div>
            )}
            <div className="md:w-1/2 bg-black px-8 md:px-16 py-12 md:py-20 flex flex-col justify-center gap-6">
                <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{p.right_heading}</h2>
                <p className="text-white/60 text-sm leading-relaxed">{p.right_body}</p>
                <a href={p.right_cta_link} className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300 w-fit">
                    {p.right_cta_text}
                </a>
            </div>
            {p.image_side === 'right' && (
                <div className="md:w-1/2 h-64 md:h-auto bg-zinc-900 flex items-center justify-center">
                    {p.left_image ? <img src={p.left_image} alt="" className="w-full h-full object-cover" /> : <span className="text-white/20 text-xs uppercase tracking-widest">Add right image</span>}
                </div>
            )}
        </section>
    )
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function NewsletterBlock({ p }: { p: NewsletterProps }) {
    return (
        <section className="py-20 px-8 bg-black">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
                <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{p.heading}</h2>
                <p className="text-white/60 text-sm leading-relaxed">{p.subheading}</p>
                <button className="border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.button_text}
                </button>
            </div>
        </section>
    )
}

// ── Testimonial ───────────────────────────────────────────────────────────────
function TestimonialBlock({ p }: { p: TestimonialProps }) {
    return (
        <section className="py-20 px-8 bg-black">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
                <p className="text-lg text-white/70 italic leading-relaxed">"{p.quote}"</p>
                <div>
                    <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">{p.author}</p>
                    <p className="text-xs text-[#D4AF37] uppercase tracking-[0.3em]">{p.role}</p>
                </div>
            </div>
        </section>
    )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function DividerBlock({ p }: { p: DividerProps }) {
    const styles = {
        line: <div className="h-px bg-white/20 mx-auto" />,
        dots: <div className="flex justify-center gap-2 text-[#D4AF37] text-sm">•••</div>,
        ornament: <div className="text-center text-[#D4AF37] text-lg">✦</div>,
    }
    return <section className="py-8 px-8 bg-black flex items-center justify-center">{styles[p.style] ?? styles.line}</section>
}

// ─────────────────────────────────────────────────────────────────────────────
// RenderBlock — dispatcher for all block types
// ─────────────────────────────────────────────────────────────────────────────
export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any

    switch (block.type) {
        case 'hero':
            return <HeroBlock p={p} />
        case 'video_hero':
            return <VideoHeroBlock p={p} />
        case 'countdown_timer':
            return <CountdownTimerBlock p={p} />
        case 'text_block':
            return <TextBlock p={p} />
        case 'image_banner':
            return <ImageBannerBlock p={p} />
        case 'before_after':
            return <BeforeAfterBlock p={p} />
        case 'icon_grid':
            return <IconGridBlock p={p} />
        case 'faq_accordion':
            return <FaqAccordionBlock p={p} />
        case 'product_shelf':
            return <ProductShelfBlock p={p} />
        case 'two_column':
            return <TwoColumnBlock p={p} />
        case 'newsletter':
            return <NewsletterBlock p={p} />
        case 'testimonial':
            return <TestimonialBlock p={p} />
        case 'divider':
            return <DividerBlock p={p} />
        default:
            return <section className="h-32 bg-red-900/20 flex items-center justify-center text-red-400 text-xs uppercase tracking-widest">Unknown block type</section>
    }
}
