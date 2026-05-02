'use client'

import { useState, useEffect } from 'react'
import { VideoHeroProps, CountdownTimerProps, BeforeAfterProps, IconGridProps, FAQAccordionProps } from './types'

// ────────────────────────────────────────────────────────────────────────────
// VIDEO HERO — Autoplay Mux video background
// ────────────────────────────────────────────────────────────────────────────
export function VideoHero({ mux_video_url, heading, subheading, cta_text, cta_link, overlay_opacity }: VideoHeroProps) {
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {/* Video background */}
            {mux_video_url && (
                <video
                    src={mux_video_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                style={{ opacity: (overlay_opacity || 40) / 100 }}
            />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-2xl">
                {subheading && (
                    <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-medium mb-4">
                        {subheading}
                    </p>
                )}
                <h1 className="text-5xl md:text-6xl font-serif text-white uppercase tracking-wide mb-8">
                    {heading}
                </h1>
                {cta_text && (
                    <a
                        href={cta_link || '/shop'}
                        className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300"
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// COUNTDOWN TIMER
// ────────────────────────────────────────────────────────────────────────────
export function CountdownTimer({ heading, subheading, end_date, cta_text, cta_link, bg_color }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime()
            const endTime = new Date(end_date).getTime()
            const distance = endTime - now

            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                })
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [end_date])

    const bgClasses = {
        black: 'bg-black',
        gold: 'bg-amber-900',
        dark_gray: 'bg-zinc-900',
    }

    return (
        <section className={`${bgClasses[bg_color] || 'bg-black'} py-20 px-8 text-center border-b border-white/10`}>
            <div className="max-w-3xl mx-auto">
                {subheading && (
                    <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-medium mb-4">
                        {subheading}
                    </p>
                )}
                <h2 className="text-4xl md:text-5xl font-serif text-white uppercase tracking-wide mb-8">
                    {heading}
                </h2>

                {/* Countdown display */}
                <div className="grid grid-cols-4 gap-4 mb-8 max-w-xl mx-auto">
                    {[
                        { value: timeLeft.days, label: 'Days' },
                        { value: timeLeft.hours, label: 'Hours' },
                        { value: timeLeft.minutes, label: 'Minutes' },
                        { value: timeLeft.seconds, label: 'Seconds' },
                    ].map(({ value, label }) => (
                        <div key={label} className="bg-white/5 border border-white/10 rounded p-4">
                            <div className="text-3xl md:text-4xl font-serif text-gold font-bold">
                                {String(value).padStart(2, '0')}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-white/60 mt-2">
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {cta_text && (
                    <a
                        href={cta_link || '/sale'}
                        className="inline-block border border-gold text-gold text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-gold hover:text-black transition-all duration-300 font-bold"
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// BEFORE/AFTER SLIDER
// ────────────────────────────────────────────────────────────────────────────
export function BeforeAfter({ before_image, after_image, caption, height }: BeforeAfterProps) {
    const [sliderPos, setSliderPos] = useState(50)
    const [isDragging, setIsDragging] = useState(false)

    const heightClasses = {
        sm: 'h-72',
        md: 'h-96',
        lg: 'h-screen',
    }

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return
        const rect = e.currentTarget.getBoundingClientRect()
        const newPos = ((e.clientX - rect.left) / rect.width) * 100
        setSliderPos(Math.max(0, Math.min(100, newPos)))
    }

    return (
        <section className="py-12 px-8 bg-black">
            <div className="max-w-4xl mx-auto">
                <div
                    className={`relative ${heightClasses[height] || 'h-96'} overflow-hidden bg-zinc-900 rounded-lg`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    {/* After image (background) */}
                    {after_image && (
                        <img
                            src={after_image}
                            alt="After"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Before image (foreground, clipped) */}
                    {before_image && (
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${sliderPos}%` }}
                        >
                            <img
                                src={before_image}
                                alt="Before"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ width: `${(100 / sliderPos) * 100}%` }}
                            />
                        </div>
                    )}

                    {/* Slider handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize select-none"
                        style={{ left: `${sliderPos}%` }}
                        onMouseDown={handleMouseDown}
                    >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <div className="text-xs font-bold text-black">↔</div>
                        </div>
                    </div>

                    {/* Labels */}
                    <span className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-widest bg-black/50 text-white px-3 py-1 rounded">
                        Before
                    </span>
                    <span className="absolute bottom-4 right-4 text-xs font-bold uppercase tracking-widest bg-black/50 text-white px-3 py-1 rounded">
                        After
                    </span>
                </div>

                {caption && (
                    <p className="text-center text-white/60 text-sm mt-4 italic">
                        {caption}
                    </p>
                )}
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// ICON GRID — Trust signals
// ────────────────────────────────────────────────────────────────────────────
export function IconGrid({ heading, columns, items }: IconGridProps) {
    const colClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }

    return (
        <section className="py-16 px-8 bg-black border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                {heading && (
                    <h2 className="text-3xl md:text-4xl font-serif text-white text-center mb-12 uppercase tracking-wide">
                        {heading}
                    </h2>
                )}

                <div className={`grid ${colClasses[columns as keyof typeof colClasses] || 'grid-cols-4'} gap-8`}>
                    {items && items.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">
                                {item.label}
                            </h3>
                            <p className="text-xs text-white/60 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FAQ ACCORDION
// ────────────────────────────────────────────────────────────────────────────
export function FAQAccordion({ heading, items }: FAQAccordionProps) {
    const [openIdx, setOpenIdx] = useState<number | null>(null)

    return (
        <section className="py-16 px-8 bg-black border-t border-white/5">
            <div className="max-w-2xl mx-auto">
                {heading && (
                    <h2 className="text-3xl md:text-4xl font-serif text-white text-center mb-12 uppercase tracking-wide">
                        {heading}
                    </h2>
                )}

                <div className="space-y-3">
                    {items && items.map((item, idx) => (
                        <div
                            key={idx}
                            className="border border-white/10 rounded overflow-hidden bg-white/[0.02] hover:border-gold/30 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                            >
                                <h3 className="font-medium text-white text-sm">
                                    {item.question}
                                </h3>
                                <span className={`text-gold text-lg transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {openIdx === idx && (
                                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
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
