'use client'
// ─────────────────────────────────────────────────────────────────────────────
// NEW BLOCK RENDERERS — 5 additional CMS blocks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { VideoHeroProps, CountdownTimerProps, BeforeAfterProps, IconGridProps, FAQProps } from './types'

// VIDEO HERO
export function VideoHero({ p }: { p: VideoHeroProps }) {
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {/* Mux video background */}
            <div className="absolute inset-0 opacity-60">
                <iframe
                    src={`https://image.mux.com/${p.video_url}/animated.gif?width=1920&height=1080`}
                    className="w-full h-full object-cover"
                    style={{ mixBlendMode: 'multiply' }}
                />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" style={{ opacity: (p.overlay_opacity || 40) / 100 }} />
            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-2xl px-6">
                <h1 className="text-5xl md:text-6xl font-serif mb-4">{p.heading}</h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">{p.subheading}</p>
                <a href={p.cta_link} className="inline-block border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all">
                    {p.cta_text}
                </a>
            </div>
        </section>
    )
}

// COUNTDOWN TIMER
export function CountdownTimer({ p }: { p: CountdownTimerProps }) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const calc = () => {
            const end = new Date(p.end_date).getTime()
            const now = Date.now()
            const diff = Math.max(0, end - now)

            setTime({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        calc()
        const int = setInterval(calc, 1000)
        return () => clearInterval(int)
    }, [p.end_date])

    return (
        <section className="py-20 px-6 text-center text-white" style={{ backgroundColor: p.background_color || '#1a1a1a' }}>
            <h2 className="text-4xl font-serif mb-2">{p.heading}</h2>
            <p className="text-lg mb-12 opacity-75">{p.subheading}</p>
            
            <div className="flex justify-center gap-4 md:gap-6 mb-12">
                {[
                    { label: 'Days', value: time.days },
                    { label: 'Hours', value: time.hours },
                    { label: 'Mins', value: time.minutes },
                    { label: 'Secs', value: time.seconds },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 border border-white/20 rounded-lg p-4 min-w-20">
                        <div className="text-3xl font-bold font-mono">{String(value).padStart(2, '0')}</div>
                        <div className="text-xs uppercase tracking-widest opacity-50 mt-1">{label}</div>
                    </div>
                ))}
            </div>

            <a href={p.button_link} className="inline-block bg-white text-black px-8 py-3 font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all">
                {p.button_text}
            </a>
        </section>
    )
}

// BEFORE/AFTER SLIDER
export function BeforeAfterSlider({ p }: { p: BeforeAfterProps }) {
    const [sliderPos, setSliderPos] = useState(50)
    const heights: Record<string, string> = { sm: 'h-64', md: 'h-96', lg: 'h-[32rem]' }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setSliderPos(((e.clientX - rect.left) / rect.width) * 100)
    }

    return (
        <section className="py-16 px-6 bg-black">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-serif text-white text-center mb-12">See The Difference</h2>
                
                <div
                    className={`relative ${heights[p.height] || 'h-96'} overflow-hidden rounded-lg bg-gray-900 cursor-col-resize`}
                    onMouseMove={handleMouseMove}
                    style={{ userSelect: 'none' }}
                >
                    <img src={p.after_image} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                        <img src={p.before_image} alt="Before" className="absolute inset-0 w-screen h-full object-cover" style={{ marginLeft: `-${(100 - sliderPos)}%` }} />
                    </div>
                    <div className="absolute top-0 bottom-0 w-1 bg-white/80" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }} />
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm font-bold">{p.before_label}</div>
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-sm font-bold">{p.after_label}</div>
                </div>
            </div>
        </section>
    )
}

// ICON GRID
export function IconGrid({ p }: { p: IconGridProps }) {
    const colClasses: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

    return (
        <section className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif text-center mb-16">{p.heading}</h2>
                <div className={`grid ${colClasses[p.columns] || 'grid-cols-4'} gap-8`}>
                    {(p.items || []).map((item, i) => (
                        <div key={i} className="text-center">
                            <div className="text-5xl mb-4">{item.icon}</div>
                            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// FAQ ACCORDION
export function FAQAccordion({ p }: { p: FAQProps }) {
    const [open, setOpen] = useState<number | null>(null)

    return (
        <section className="py-20 px-6 bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif text-center mb-16">{p.heading}</h2>
                <div className="space-y-3">
                    {(p.items || []).map((item, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full px-6 py-4 text-left font-bold flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                                {item.question}
                                <span className={`text-2xl transition-transform ${open === i ? 'rotate-180' : ''}`}>↓</span>
                            </button>
                            {open === i && (
                                <div className="px-6 py-4 bg-white text-gray-700 border-t border-gray-200">
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
