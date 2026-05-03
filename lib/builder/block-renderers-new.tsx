'use client'

import React, { useState, useEffect } from 'react'
import { VideoHeroProps, CountdownTimerProps, BeforeAfterProps, IconGridProps, FAQAccordionProps } from './types-extended'

// ────────────────────────────────────────────────────────────────────────────
// VIDEO HERO — Autoplay muted background video with text overlay
// ────────────────────────────────────────────────────────────────────────────
export function VideoHero({ p }: { p: VideoHeroProps }) {
    return (
        <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-black">
            {p.video_url && (
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay={p.autoplay}
                    muted
                    loop
                    playsInline
                >
                    <source src={p.video_url} type="video/mp4" />
                </video>
            )}
            <div
                className="absolute inset-0 bg-black/40"
                style={{ opacity: p.overlay_opacity / 100 }}
            />
            <div className="relative z-10 text-center text-white px-8 max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80 mb-3">Visual Story</p>
                <h1 className="text-4xl md:text-6xl font-serif italic mb-4">{p.heading}</h1>
                <p className="text-lg md:text-xl font-light mb-8 text-white/90">{p.subheading}</p>
                <a
                    href={p.cta_link}
                    className="inline-block border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-300 text-sm font-semibold tracking-widest uppercase"
                >
                    {p.cta_text}
                </a>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// COUNTDOWN TIMER — Live countdown with urgency messaging
// ────────────────────────────────────────────────────────────────────────────
export function CountdownTimer({ p }: { p: CountdownTimerProps }) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            const now = new Date().getTime()
            const endDate = new Date(p.end_date).getTime()
            const diff = endDate - now

            if (diff > 0) {
                setTime({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                })
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [p.end_date])

    if (!mounted) return null

    const colorClass = {
        red: 'text-red-500 border-red-500/30 bg-red-950/10',
        gold: 'text-gold border-gold/30 bg-gold/5',
        white: 'text-white border-white/30 bg-white/5',
    }[p.urgent_color]

    return (
        <section className="py-20 px-8 bg-gradient-to-b from-black to-black/80 text-white text-center">
            <h2 className="text-3xl md:text-5xl font-serif italic mb-2">{p.heading}</h2>
            <p className="text-white/60 mb-12">{p.subheading}</p>

            <div className="flex justify-center gap-4 md:gap-8 mb-12">
                {Object.entries(time).map(([key, val]) => (
                    <div key={key} className={`flex flex-col items-center p-4 border rounded ${colorClass}`}>
                        <div className="text-3xl md:text-5xl font-bold">{String(val).padStart(2, '0')}</div>
                        <div className="text-xs uppercase tracking-widest mt-2 text-white/60">{key}</div>
                    </div>
                ))}
            </div>

            {p.show_button && (
                <a
                    href={p.button_link}
                    className="inline-block border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all"
                >
                    {p.button_text}
                </a>
            )}
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// BEFORE/AFTER SLIDER — Drag to compare two images
// ────────────────────────────────────────────────────────────────────────────
export function BeforeAfter({ p }: { p: BeforeAfterProps }) {
    const [position, setPosition] = useState(p.initial_position)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const handleMouseDown = () => {
        const onMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const newPos = ((e.clientX - rect.left) / rect.width) * 100
            setPosition(Math.max(0, Math.min(100, newPos)))
        }
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }

    return (
        <section className="py-20 px-8 bg-black">
            <h2 className="text-3xl md:text-4xl font-serif text-center text-white mb-12">
                See The Transformation
            </h2>
            <div
                ref={containerRef}
                className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-lg bg-black/50 cursor-col-resize group"
                onMouseDown={handleMouseDown}
            >
                {/* After (background) */}
                {p.after_image && (
                    <img
                        src={p.after_image}
                        alt="After"
                        className="w-full h-auto block"
                    />
                )}

                {/* Before (foreground, clipped) */}
                {p.before_image && (
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                        <img
                            src={p.before_image}
                            alt="Before"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Slider handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white/80 group-hover:bg-white transition-colors"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg">
                        <div className="w-6 h-6 flex items-center justify-center text-black text-xs font-bold">
                            ↔
                        </div>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 text-white text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded">
                    {p.before_label}
                </div>
                <div className="absolute top-4 right-4 text-white text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded">
                    {p.after_label}
                </div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// ICON GRID — Trust signals and feature highlights
// ────────────────────────────────────────────────────────────────────────────
export function IconGrid({ p }: { p: IconGridProps }) {
    const colClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }[p.columns] || 'grid-cols-4'

    return (
        <section className="py-20 px-8 bg-black border-t border-white/10">
            <h2 className="text-3xl md:text-4xl font-serif text-center text-white mb-16">{p.heading}</h2>
            <div className={`grid ${colClass} gap-8 max-w-5xl mx-auto`}>
                {p.items.map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className="text-5xl mb-4 transition-transform group-hover:scale-110">
                            {item.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{item.label}</h3>
                        <p className="text-sm text-white/60">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FAQ ACCORDION — Collapsible Q&A
// ────────────────────────────────────────────────────────────────────────────
export function FAQAccordion({ p }: { p: FAQAccordionProps }) {
    const [expanded, setExpanded] = useState<number | null>(0)

    return (
        <section className="py-20 px-8 bg-black/50">
            <h2 className="text-3xl md:text-4xl font-serif text-center text-white mb-12">
                {p.heading}
            </h2>
            <div className="max-w-2xl mx-auto space-y-3">
                {p.items.map((item, i) => (
                    <div
                        key={i}
                        className="border border-white/10 rounded overflow-hidden bg-black/30 hover:border-gold/30 transition-colors"
                    >
                        <button
                            onClick={() => setExpanded(expanded === i ? null : i)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <span className="font-semibold text-white">{item.question}</span>
                            <span
                                className={`text-gold text-lg transition-transform ${
                                    expanded === i ? 'rotate-180' : ''
                                }`}
                            >
                                ▼
                            </span>
                        </button>
                        {expanded === i && (
                            <div className="px-6 py-4 border-t border-white/10 bg-white/5 text-white/80 text-sm">
                                {item.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}
