'use client'

import React, { useState, useEffect } from 'react'
import {
    VideoHeroProps,
    CountdownTimerProps,
    BeforeAfterProps,
    IconGridProps,
    FAQAccordionProps,
} from './types-extended'

// ─────────────────────────────────────────────────────────────────────────────
// 1. VIDEO HERO — Autoplay background video with overlay text
// ─────────────────────────────────────────────────────────────────────────────
export function VideoHero(props: VideoHeroProps) {
    return (
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-black">
            {/* Video background */}
            <video
                src={props.video_url}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: props.overlay_opacity / 100 }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-3xl mx-auto px-8 text-center text-white">
                <h1 className="text-5xl md:text-6xl font-serif mb-4 tracking-wide italic">
                    {props.heading}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-white/80 font-light">
                    {props.subheading}
                </p>
                <a
                    href={props.cta_link}
                    className="inline-block border border-white text-white text-sm uppercase tracking-[0.2em] px-8 py-4 hover:bg-white hover:text-black transition-all duration-300"
                >
                    {props.cta_text}
                </a>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COUNTDOWN TIMER — Live countdown clock
// ─────────────────────────────────────────────────────────────────────────────
export function CountdownTimer(props: CountdownTimerProps) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const updateCountdown = () => {
            const target = new Date(props.end_date).getTime()
            const now = new Date().getTime()
            const diff = target - now

            if (diff > 0) {
                setTime({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                })
            } else {
                setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [props.end_date])

    if (!mounted) return null

    const TimeUnit = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div
                className="text-4xl md:text-5xl font-bold w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-lg border-2"
                style={{ borderColor: props.text_color, color: props.text_color }}
            >
                {String(value).padStart(2, '0')}
            </div>
            {props.show_labels && (
                <p className="text-xs uppercase tracking-widest mt-2" style={{ color: props.text_color }}>
                    {label}
                </p>
            )}
        </div>
    )

    return (
        <section
            className="py-20 px-8 flex flex-col items-center justify-center"
            style={{ backgroundColor: props.background_color }}
        >
            <h2 className="text-3xl md:text-4xl font-serif mb-4" style={{ color: props.text_color }}>
                {props.heading}
            </h2>
            <p className="text-lg mb-12 opacity-90" style={{ color: props.text_color }}>
                {props.message}
            </p>

            <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                <TimeUnit value={time.days} label="Days" />
                <TimeUnit value={time.hours} label="Hours" />
                <TimeUnit value={time.minutes} label="Minutes" />
                <TimeUnit value={time.seconds} label="Seconds" />
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEFORE/AFTER SLIDER — Drag to compare images
// ─────────────────────────────────────────────────────────────────────────────
export function BeforeAfter(props: BeforeAfterProps) {
    const [position, setPosition] = useState(props.initial_position)
    const [isDragging, setIsDragging] = useState(false)

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return

        const container = (e.currentTarget as HTMLElement)
        const rect = container.getBoundingClientRect()
        const x = (e as React.MouseEvent).clientX || (e as React.TouchEvent).touches[0].clientX
        const newPos = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100))
        setPosition(newPos)
    }

    return (
        <section className="py-16 px-8 bg-white">
            <div className="max-w-4xl mx-auto">
                <div
                    className="relative w-full overflow-hidden rounded-lg cursor-col-resize select-none"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseMove={handleMove}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    onTouchMove={handleMove}
                    style={{ aspectRatio: '16 / 9' }}
                >
                    {/* After image (full width) */}
                    <img
                        src={props.after_image}
                        alt="After"
                        className="w-full h-full object-cover"
                    />

                    {/* Before image (clipped by position) */}
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${position}%` }}
                    >
                        <img
                            src={props.before_image}
                            alt="Before"
                            className="w-full h-full object-cover"
                            style={{ width: `${100 / (position / 100)}%` }}
                        />
                    </div>

                    {/* Slider handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
                        style={{ left: `${position}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-3 flex gap-2">
                            <span className="text-black text-xs font-bold">◀</span>
                            <span className="text-black text-xs font-bold">▶</span>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm font-bold">
                        {props.before_label}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm font-bold">
                        {props.after_label}
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ICON GRID — Trust signals with icons and text
// ─────────────────────────────────────────────────────────────────────────────
export function IconGrid(props: IconGridProps) {
    return (
        <section className="py-20 px-8 bg-black">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif text-white text-center mb-16 tracking-wide">
                    {props.heading}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {props.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                            <div className="text-5xl mb-4">{item.icon}</div>
                            <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                            <p className="text-white/60 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FAQ ACCORDION — Collapsible Q&A
// ─────────────────────────────────────────────────────────────────────────────
export function FAQAccordion(props: FAQAccordionProps) {
    const [expanded, setExpanded] = useState<number | null>(null)

    return (
        <section className="py-20 px-8 bg-white">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif text-black text-center mb-12 tracking-wide">
                    {props.heading}
                </h2>

                <div className="space-y-4">
                    {props.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="border border-black/20 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => setExpanded(expanded === idx ? null : idx)}
                                className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-black/5 transition-colors"
                            >
                                <h3 className="font-bold text-lg text-black text-left">
                                    {item.question}
                                </h3>
                                <span className="text-2xl text-black">
                                    {expanded === idx ? '−' : '+'}
                                </span>
                            </button>

                            {expanded === idx && (
                                <div className="px-6 py-4 bg-black/5 border-t border-black/20">
                                    <p className="text-black/70 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
