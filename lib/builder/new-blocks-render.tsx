'use client'
// ─────────────────────────────────────────────────────────────────────────────
// NEW 5 BLOCK RENDERERS (Video Hero, Countdown, Before/After, Icon Grid, FAQ)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import {
    VideoHeroProps,
    CountdownTimerProps,
    BeforeAfterProps,
    IconGridProps,
    FAQAccordionProps,
} from './types-extended'

// ──────────────────────────────────────────────────────────────────────────────
// VIDEO HERO — Mux autoplay video with overlay text + CTA
// ──────────────────────────────────────────────────────────────────────────────
export function VideoHero({ p }: { p: VideoHeroProps }) {
    return (
        <section className="relative w-full h-[70vh] min-h-[400px] bg-black overflow-hidden flex items-center justify-center">
            {/* Video Background */}
            {p.video_url && (
                <video
                    src={p.video_url}
                    autoPlay={p.autoplay}
                    muted={p.muted}
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: p.overlay_opacity / 100 }}
            />

            {/* Content */}
            <div className="relative z-10 text-center text-white px-8 max-w-3xl mx-auto">
                {p.heading && (
                    <h1 className="text-4xl md:text-6xl font-serif mb-4 font-bold tracking-tight">
                        {p.heading}
                    </h1>
                )}
                {p.subheading && (
                    <p className="text-lg md:text-xl mb-8 text-white/80 font-light">
                        {p.subheading}
                    </p>
                )}
                {p.cta_text && p.cta_link && (
                    <Link
                        href={p.cta_link}
                        className="inline-block bg-white text-black px-8 py-3 font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        {p.cta_text}
                    </Link>
                )}
            </div>
        </section>
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// COUNTDOWN TIMER — Live countdown (days/hours/mins/secs)
// ──────────────────────────────────────────────────────────────────────────────
export function CountdownTimer({ p }: { p: CountdownTimerProps }) {
    const [time, setTime] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime()
            const endTime = new Date(p.end_date).getTime()
            const diff = endTime - now

            if (diff <= 0) {
                setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            } else {
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

    return (
        <section
            className="py-16 px-8 text-center"
            style={{ backgroundColor: p.background_color }}
        >
            <div className="max-w-3xl mx-auto">
                {p.heading && (
                    <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: p.text_color }}>
                        {p.heading}
                    </h2>
                )}
                {p.subheading && (
                    <p className="mb-8 opacity-80" style={{ color: p.text_color }}>
                        {p.subheading}
                    </p>
                )}

                {/* Countdown Display */}
                <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
                    {[
                        { label: 'DAYS', value: time.days },
                        { label: 'HOURS', value: time.hours },
                        { label: 'MINS', value: time.minutes },
                        { label: 'SECS', value: time.seconds },
                    ].map((unit) => (
                        <div
                            key={unit.label}
                            className="flex flex-col items-center p-4 border"
                            style={{ borderColor: p.text_color }}
                        >
                            <div
                                className="text-4xl md:text-5xl font-bold mb-2 font-mono"
                                style={{ color: p.text_color }}
                            >
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            {p.show_labels && (
                                <div
                                    className="text-xs uppercase tracking-widest"
                                    style={{ color: p.text_color, opacity: 0.7 }}
                                >
                                    {unit.label}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// BEFORE/AFTER SLIDER — Drag to compare two images
// ──────────────────────────────────────────────────────────────────────────────
export function BeforeAfterSlider({ p }: { p: BeforeAfterProps }) {
    const [position, setPosition] = useState(p.initial_position)
    const [isDragging, setIsDragging] = useState(false)

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return

        const container = e.currentTarget
        const rect = container.getBoundingClientRect()
        const newPosition = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
        setPosition(newPosition)
    }

    return (
        <section className="py-20 px-8 bg-white">
            <div className="max-w-4xl mx-auto">
                <div
                    className="relative overflow-hidden rounded-lg select-none"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseUp={handleMouseUp}
                >
                    {/* After Image (Base) */}
                    <img
                        src={p.after_image}
                        alt={p.after_label}
                        className="w-full h-auto block"
                    />

                    {/* Before Image (Overlay) */}
                    <div
                        className="absolute top-0 left-0 h-full overflow-hidden"
                        style={{ width: `${position}%` }}
                    >
                        <img
                            src={p.before_image}
                            alt={p.before_label}
                            className="w-screen h-full object-cover"
                            style={{ width: `calc(100vw * (100/${position}))` }}
                        />
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize group"
                        style={{ left: `${position}%` }}
                        onMouseDown={handleMouseDown}
                    >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-2 rounded text-black text-xs font-bold">
                            ↔
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-xs font-bold">
                        {p.before_label}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-xs font-bold">
                        {p.after_label}
                    </div>
                </div>
            </div>
        </section>
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// ICON GRID — Trust signals (shipping, cruelty-free, vegan, etc.)
// ──────────────────────────────────────────────────────────────────────────────
export function IconGrid({ p }: { p: IconGridProps }) {
    const gridClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }[p.columns] || 'grid-cols-4'

    return (
        <section className="py-16 px-8 bg-black">
            <div className="max-w-6xl mx-auto">
                <div className={`grid ${gridClass} gap-8`}>
                    {p.items.map((item) => (
                        <div
                            key={item.id}
                            className="text-center text-white flex flex-col items-center p-6 border border-white/10 rounded-lg hover:border-white/30 transition-all"
                        >
                            <div className="text-5xl mb-4">{item.icon}</div>
                            <h3 className="font-bold text-sm uppercase tracking-widest mb-2">
                                {item.label}
                            </h3>
                            {item.description && (
                                <p className="text-xs text-white/60">{item.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// FAQ ACCORDION — Collapsible Q&A
// ──────────────────────────────────────────────────────────────────────────────
export function FAQAccordion({ p }: { p: FAQAccordionProps }) {
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <section className="py-20 px-8 bg-white">
            <div className="max-w-3xl mx-auto">
                {p.heading && (
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
                        {p.heading}
                    </h2>
                )}

                <div className="space-y-4">
                    {p.items.map((item) => (
                        <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setExpanded(expanded === item.id ? null : item.id)
                                }
                                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-all text-left"
                            >
                                <h3 className="font-bold text-black text-sm md:text-base">
                                    {item.question}
                                </h3>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-600 transition-transform ${
                                        expanded === item.id ? 'transform rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {expanded === item.id && (
                                <div className="px-6 py-4 bg-white text-gray-700 text-sm leading-relaxed border-t border-gray-200">
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
