'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// 1. VIDEO HERO — Mux autoplay background with text overlay
// ────────────────────────────────────────────────────────────────────────────
export function VideoHero({
    heading,
    subheading,
    cta_text,
    cta_link,
    mux_video_url,
    overlay_opacity,
    autoplay,
}: {
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    mux_video_url: string
    overlay_opacity: number
    autoplay: boolean
}) {
    return (
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-black">
            {/* Video background */}
            {mux_video_url && (
                <iframe
                    src={mux_video_url}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    allow="autoplay; muted"
                    muted
                    autoPlay={autoplay}
                    loop
                    className="absolute inset-0"
                />
            )}

            {/* Dark overlay */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: overlay_opacity / 100 }}
            />

            {/* Content */}
            <div className="relative z-10 text-center text-white px-6 max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-serif mb-4 tracking-wide">
                    {heading}
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8 font-light">
                    {subheading}
                </p>
                {cta_text && (
                    <Link
                        href={cta_link || '#'}
                        className="inline-block border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-300 text-sm uppercase tracking-[0.3em] font-bold"
                    >
                        {cta_text}
                    </Link>
                )}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. COUNTDOWN TIMER — Live countdown with urgency messaging
// ────────────────────────────────────────────────────────────────────────────
export function CountdownTimer({
    heading,
    subheading,
    end_date,
    cta_text,
    cta_link,
    bg_color,
}: {
    heading: string
    subheading: string
    end_date: string
    cta_text: string
    cta_link: string
    bg_color: 'black' | 'gold' | 'dark_gray'
}) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [expired, setExpired] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime()
            const target = new Date(end_date).getTime()
            const distance = target - now

            if (distance <= 0) {
                setExpired(true)
                clearInterval(timer)
            } else {
                setTime({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((distance / 1000 / 60) % 60),
                    seconds: Math.floor((distance / 1000) % 60),
                })
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [end_date])

    const bgClasses = {
        black: 'bg-black',
        gold: 'bg-yellow-900/30',
        dark_gray: 'bg-gray-900',
    }

    const textColor = bg_color === 'gold' ? 'text-yellow-700' : 'text-white'
    const accentColor = bg_color === 'gold' ? 'text-yellow-500' : 'text-gold'

    if (expired) {
        return (
            <section className={`${bgClasses[bg_color]} py-16 px-6`}>
                <div className="max-w-4xl mx-auto text-center text-white">
                    <p className="text-xl font-light">Sale has ended</p>
                </div>
            </section>
        )
    }

    return (
        <section className={`${bgClasses[bg_color]} py-16 px-6`}>
            <div className="max-w-4xl mx-auto text-center">
                <h2 className={`text-3xl md:text-4xl font-serif mb-3 ${textColor}`}>
                    {heading}
                </h2>
                <p className={`text-lg mb-8 ${textColor} font-light`}>{subheading}</p>

                {/* Timer display */}
                <div className="flex justify-center gap-4 md:gap-8 mb-10">
                    {[
                        { label: 'Days', value: time.days },
                        { label: 'Hours', value: time.hours },
                        { label: 'Mins', value: time.minutes },
                        { label: 'Secs', value: time.seconds },
                    ].map((unit) => (
                        <div key={unit.label} className="text-center">
                            <div className={`text-3xl md:text-4xl font-bold ${accentColor} mb-1`}>
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            <div className={`text-xs uppercase tracking-widest ${textColor} opacity-70`}>
                                {unit.label}
                            </div>
                        </div>
                    ))}
                </div>

                {cta_text && (
                    <Link
                        href={cta_link || '#'}
                        className="inline-block border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-300 text-sm uppercase tracking-[0.3em] font-bold"
                    >
                        {cta_text}
                    </Link>
                )}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. BEFORE/AFTER SLIDER — Drag to compare images
// ────────────────────────────────────────────────────────────────────────────
export function BeforeAfter({
    before_image,
    after_image,
    caption,
    height,
}: {
    before_image: string
    after_image: string
    caption: string
    height: 'sm' | 'md' | 'lg'
}) {
    const [position, setPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)

    const heightClasses = {
        sm: 'h-64',
        md: 'h-96',
        lg: 'h-screen',
    }

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return

        const container = e.currentTarget
        const rect = container.getBoundingClientRect()
        const newPosition = ((e.clientX - rect.left) / rect.width) * 100
        setPosition(Math.max(0, Math.min(100, newPosition)))
    }

    return (
        <section className="py-16 px-6 bg-black">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-serif text-white mb-2">See The Difference</h2>
                    {caption && <p className="text-white/60 text-sm">{caption}</p>}
                </div>

                <div
                    className={`relative ${heightClasses[height]} overflow-hidden rounded-lg bg-gray-900 cursor-col-resize`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                >
                    {/* After image (background) */}
                    {after_image && (
                        <Image
                            src={after_image}
                            alt="After"
                            fill
                            className="object-cover"
                        />
                    )}

                    {/* Before image (overlay) */}
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${position}%` }}
                    >
                        {before_image && (
                            <Image
                                src={before_image}
                                alt="Before"
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>

                    {/* Slider handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white/80 transition-none"
                        style={{ left: `${position}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3">
                            <div className="flex gap-1">
                                <div className="w-0.5 h-4 bg-black" />
                                <div className="w-0.5 h-4 bg-black" />
                            </div>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 text-white text-xs uppercase tracking-widest font-bold bg-black/50 px-3 py-1 rounded">
                        Before
                    </div>
                    <div className="absolute top-4 right-4 text-white text-xs uppercase tracking-widest font-bold bg-black/50 px-3 py-1 rounded">
                        After
                    </div>
                </div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// 4. ICON GRID — Trust signals
// ────────────────────────────────────────────────────────────────────────────
export function IconGrid({
    heading,
    columns,
    items,
}: {
    heading: string
    columns: number
    items: Array<{
        icon: string
        label: string
        description: string
    }>
}) {
    const gridClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4',
    }

    return (
        <section className="py-16 px-6 bg-black border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                {heading && (
                    <h2 className="text-2xl font-serif text-white text-center mb-12">
                        {heading}
                    </h2>
                )}

                <div className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-8 md:gap-12`}>
                    {items.map((item, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-white font-serif text-lg mb-2">{item.label}</h3>
                            <p className="text-white/50 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// 5. FAQ ACCORDION — Collapsible Q&A
// ────────────────────────────────────────────────────────────────────────────
export function FAQAccordion({
    heading,
    items,
}: {
    heading: string
    items: Array<{
        question: string
        answer: string
    }>
}) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

    return (
        <section className="py-16 px-6 bg-black border-t border-white/5">
            <div className="max-w-3xl mx-auto">
                {heading && (
                    <h2 className="text-2xl font-serif text-white text-center mb-12">
                        {heading}
                    </h2>
                )}

                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className="border border-white/10 rounded-lg overflow-hidden hover:border-gold/30 transition-colors"
                        >
                            <button
                                onClick={() =>
                                    setExpandedIdx(expandedIdx === idx ? null : idx)
                                }
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                            >
                                <h3 className="text-white font-serif">{item.question}</h3>
                                <ChevronDown
                                    className={`w-5 h-5 text-white/50 transition-transform ${
                                        expandedIdx === idx ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {expandedIdx === idx && (
                                <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                                    <p className="text-white/70 text-sm leading-relaxed">
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
