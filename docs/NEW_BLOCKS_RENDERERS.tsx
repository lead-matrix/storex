// ─────────────────────────────────────────────────────────────────────────────
// New Block Render Components
// Add these to lib/builder/BlockRegistry.tsx (in the RenderBlock switch statement)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Image from 'next/image'

// ─────────────────────────────────────────────────────────────────────────────
// 1. VIDEO HERO
// ─────────────────────────────────────────────────────────────────────────────
function VideoHero({ p }: { p: any }) {
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {/* Mux video background */}
            {p.mux_playback_id && (
                <iframe
                    src={`https://image.mux.com/${p.mux_playback_id}/animated.gif`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ pointerEvents: 'none' }}
                />
            )}
            
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: (p.overlay_opacity || 50) / 100 }}
            />

            {/* Text + CTA */}
            <div className="relative z-10 text-center text-white px-8 max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-serif mb-4 tracking-tight">{p.heading}</h1>
                <p className="text-lg md:text-xl text-white/80 mb-8 font-light">{p.subheading}</p>
                <button className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {p.cta_text || 'Learn More'}
                </button>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COUNTDOWN TIMER
// ─────────────────────────────────────────────────────────────────────────────
function CountdownTimer({ p }: { p: any }) {
    const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

    useEffect(() => {
        const tick = () => {
            const now = Date.now()
            const end = new Date(p.end_date).getTime()
            const diff = Math.max(0, end - now)

            setTime({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / 1000 / 60) % 60),
                secs: Math.floor((diff / 1000) % 60),
            })
        }
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [p.end_date])

    const colorClass = {
        red: 'bg-red-600',
        orange: 'bg-orange-600',
        gold: 'bg-yellow-600',
    }[p.urgent_color || 'gold']

    return (
        <section className="py-20 px-8 bg-gradient-to-b from-black to-zinc-900 text-center">
            <h2 className="text-4xl font-serif text-white mb-2">{p.heading}</h2>
            <p className="text-white/60 mb-12">{p.subheading}</p>

            <div className="flex justify-center gap-6 md:gap-10">
                {[
                    { val: time.days, label: 'Days' },
                    { val: time.hours, label: 'Hours' },
                    { val: time.mins, label: 'Mins' },
                    { val: time.secs, label: 'Secs' },
                ].map((unit) => (
                    <div key={unit.label} className="flex flex-col items-center">
                        <div className={`${colorClass} text-white font-bold text-3xl md:text-5xl w-20 h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center mb-2`}>
                            {String(unit.val).padStart(2, '0')}
                        </div>
                        {p.show_labels && <span className="text-white/40 text-xs uppercase tracking-widest">{unit.label}</span>}
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEFORE/AFTER SLIDER
// ─────────────────────────────────────────────────────────────────────────────
function BeforeAfter({ p }: { p: any }) {
    const [sliderPos, setSliderPos] = useState(50)

    const heightClass = {
        sm: 'h-64',
        md: 'h-96',
        lg: 'h-[500px]',
    }[p.height || 'md']

    return (
        <section className="py-20 px-8 bg-black flex justify-center">
            <div className={`relative w-full max-w-2xl ${heightClass} overflow-hidden rounded-lg group cursor-col-resize`}>
                {/* After image (background) */}
                <img
                    src={p.after_image_url || 'https://via.placeholder.com/600x400?text=After'}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Before image (overlay) */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                >
                    <img
                        src={p.before_image_url || 'https://via.placeholder.com/600x400?text=Before'}
                        alt="Before"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ width: `${100 / (sliderPos / 100)}%` }}
                    />
                </div>

                {/* Slider divider */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white/70 cursor-col-resize"
                    style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    onMouseMove={(e) => {
                        if (e.buttons !== 1) return
                        const rect = e.currentTarget.parentElement?.getBoundingClientRect()
                        if (rect) setSliderPos(((e.clientX - rect.left) / rect.width) * 100)
                    }}
                />

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs uppercase tracking-widest px-3 py-1 rounded">
                    {p.before_label || 'Before'}
                </div>
                <div className="absolute top-4 right-4 bg-black/60 text-white text-xs uppercase tracking-widest px-3 py-1 rounded">
                    {p.after_label || 'After'}
                </div>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ICON GRID (Trust Signals)
// ─────────────────────────────────────────────────────────────────────────────
function IconGrid({ p }: { p: any }) {
    const cols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }[p.columns || 4]

    return (
        <section className="py-20 px-8 bg-black border-y border-white/10">
            <div className={`grid ${cols} gap-8 max-w-6xl mx-auto`}>
                {p.items && p.items.map((item: any) => (
                    <div key={item.id} className="text-center">
                        <div className="text-5xl mb-4">{item.icon}</div>
                        <h3 className="text-white font-semibold mb-2">{item.label}</h3>
                        <p className="text-white/50 text-sm">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FAQ ACCORDION
// ─────────────────────────────────────────────────────────────────────────────
function FAQAccordion({ p }: { p: any }) {
    const [open, setOpen] = useState<string | null>(null)

    return (
        <section className="py-20 px-8 bg-zinc-950">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-serif text-white text-center mb-12">{p.heading}</h2>

                <div className="space-y-4">
                    {p.items && p.items.map((item: any) => (
                        <div
                            key={item.id}
                            className="border border-white/10 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => setOpen(open === item.id ? null : item.id)}
                                className="w-full px-6 py-4 flex items-center justify-between bg-black hover:bg-white/5 transition-colors"
                            >
                                <h3 className="font-semibold text-white text-left">{item.question}</h3>
                                <span className="text-gold text-2xl flex-shrink-0 ml-4">
                                    {open === item.id ? '−' : '+'}
                                </span>
                            </button>

                            {open === item.id && (
                                <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-white/80">
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

// ─────────────────────────────────────────────────────────────────────────────
// Add these cases to RenderBlock switch statement:
// ─────────────────────────────────────────────────────────────────────────────

/*
        case 'video_hero': return <VideoHero p={p} />
        case 'countdown_timer': return <CountdownTimer p={p} />
        case 'before_after': return <BeforeAfter p={p} />
        case 'icon_grid': return <IconGrid p={p} />
        case 'faq_accordion': return <FAQAccordion p={p} />
*/
