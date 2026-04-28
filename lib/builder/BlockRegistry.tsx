'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — renders every block type as a real, styled preview.
// Single source of truth used in both the canvas and public pages.
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
    const videoSrc = p.mux_playback_id
        ? `https://stream.mux.com/${p.mux_playback_id}/low.mp4`
        : null
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {videoSrc ? (
                <video
                    src={videoSrc}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest">Add Mux Playback ID in settings</span>
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
            {p.heading && (
                <h2 className="text-center text-2xl md:text-3xl font-serif text-white tracking-widest mb-10">{p.heading}</h2>
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
                    ? <img src={p.after_image} alt={p.after_label} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">{p.after_label || 'After'}</div>
                }
                {/* Before image (clipped) */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    {p.before_image
                        ? <img src={p.before_image} alt={p.before_label} className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
                        : <div className="absolute inset-0 bg-zinc-700 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">{p.before_label || 'Before'}</div>
                    }
                </div>
                {/* Slider handle */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                        <span className="text-black text-xs font-bold select-none">↔</span>
                    </div>
                </div>
                {/* Labels */}
                <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded">{p.before_label || 'Before'}</span>
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] uppercase tracking-widest px-2 py-1 rounded">{p.after_label || 'After'}</span>
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

// ── Icon Grid ─────────────────────────────────────────────────────────────────
function IconGridBlock({ p }: { p: IconGridProps }) {
    let items: { icon: string; label: string; description: string }[] = []
    try { items = JSON.parse(p.icons) } catch { items = [] }
    return (
        <section className="py-16 px-8 bg-black border-t border-zinc-900">
            {p.heading && <h2 className="text-center text-xl font-serif text-white tracking-widest mb-10">{p.heading}</h2>}
            <div className={`max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-8`}>
                {items.map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-3">
                        <span className="text-4xl">{item.icon}</span>
                        <p className="text-white font-medium text-sm uppercase tracking-widest">{item.label}</p>
                        {item.description && <p className="text-white/40 text-xs leading-relaxed">{item.description}</p>}
                    </div>
                ))}
            </div>
        </section>
    )
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
const BG_MAP = {
    black: 'bg-black',
    dark: 'bg-zinc-950',
    gold: 'bg-[#D4AF37]',
}
function CountdownTimerBlock({ p }: { p: CountdownTimerProps }) {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
    useEffect(() => {
        const calc = () => {
            const diff = Math.max(0, new Date(p.end_date).getTime() - Date.now())
            setTimeLeft({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
            })
        }
        calc()
        const t = setInterval(calc, 1000)
        return () => clearInterval(t)
    }, [p.end_date])

    const isGold = p.background_color === 'gold'
    const bgCls = BG_MAP[p.background_color] ?? BG_MAP.dark
    const textCls = isGold ? 'text-black' : 'text-white'
    const subCls = isGold ? 'text-black/60' : 'text-white/50'
    const numBg = isGold ? 'bg-black/10' : 'bg-white/10'

    return (
        <section className={`py-16 px-8 ${bgCls}`}>
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
                <h2 className={`text-2xl md:text-3xl font-serif tracking-widest ${textCls}`}>{p.heading}</h2>
                {p.subheading && <p className={`text-sm leading-relaxed ${subCls}`}>{p.subheading}</p>}
                <div className="flex gap-4 md:gap-8">
                    {[
                        { val: timeLeft.d, label: 'Days' },
                        { val: timeLeft.h, label: 'Hours' },
                        { val: timeLeft.m, label: 'Mins' },
                        { val: timeLeft.s, label: 'Secs' },
                    ].map(({ val, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <div className={`${numBg} rounded px-4 py-3 min-w-[3.5rem] text-center`}>
                                <span className={`text-3xl md:text-4xl font-mono font-bold tabular-nums ${textCls}`}>
                                    {String(val).padStart(2, '0')}
                                </span>
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest ${subCls}`}>{label}</span>
                        </div>
                    ))}
                </div>
                {p.cta_text && (
                    <a href={p.cta_link}
                        className={`inline-block border px-8 py-3 text-xs uppercase tracking-[0.3em] transition-all duration-300 
                            ${isGold ? 'border-black text-black hover:bg-black hover:text-[#D4AF37]' : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}>
                        {p.cta_text}
                    </a>
                )}
            </div>
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

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function FaqAccordionBlock({ p }: { p: FaqAccordionProps }) {
    const [open, setOpen] = useState<number | null>(null)
    let items: { question: string; answer: string }[] = []
    try { items = JSON.parse(p.items) } catch { items = [] }
    return (
        <section className="py-16 px-8 bg-black">
            <div className="max-w-2xl mx-auto">
                {p.heading && <h2 className="text-center text-2xl md:text-3xl font-serif text-white tracking-widest mb-10">{p.heading}</h2>}
                <div className="flex flex-col divide-y divide-white/10">
                    {items.map((item, i) => (
                        <div key={i}>
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between py-5 text-left gap-4 group"
                            >
                                <span className="text-white text-sm font-medium tracking-wide group-hover:text-[#D4AF37] transition-colors">{item.question}</span>
                                <span className={`text-[#D4AF37] text-lg font-light flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>+</span>
                            </button>
                            {open === i && (
                                <div className="pb-5">
                                    <p className="text-white/50 text-sm leading-relaxed">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ── Public entry point ────────────────────────────────────────────────────────
export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any
    switch (block.type) {
        case 'hero':             return <HeroBlock p={p} />
        case 'video_hero':       return <VideoHeroBlock p={p} />
        case 'text_block':       return <TextBlock p={p} />
        case 'image_banner':     return <ImageBannerBlock p={p} />
        case 'before_after':     return <BeforeAfterBlock p={p} />
        case 'product_shelf':    return <ProductShelfBlock p={p} />
        case 'two_column':       return <TwoColumnBlock p={p} />
        case 'icon_grid':        return <IconGridBlock p={p} />
        case 'countdown_timer':  return <CountdownTimerBlock p={p} />
        case 'newsletter':       return <NewsletterBlock p={p} />
        case 'divider':          return <DividerBlock p={p} />
        case 'testimonial':      return <TestimonialBlock p={p} />
        case 'faq_accordion':    return <FaqAccordionBlock p={p} />
        default:                 return null
    }
}
