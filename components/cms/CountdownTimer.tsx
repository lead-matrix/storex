
'use client'
import { useState, useEffect } from 'react'
import { CountdownTimerProps } from '@/lib/builder/types'

const BG_MAP: Record<string, string> = {
    black: 'bg-black',
    dark_gray: 'bg-zinc-950',
    gold: 'bg-[#D4AF37]',
}

export default function CountdownTimer({ heading, subheading, end_date, cta_text, cta_link, bg_color }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
    useEffect(() => {
        const calc = () => {
            const diff = Math.max(0, new Date(end_date).getTime() - Date.now())
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
    }, [end_date])

    const isGold = bg_color === 'gold'
    const bgCls = BG_MAP[bg_color] ?? BG_MAP.dark_gray
    const textCls = isGold ? 'text-black' : 'text-white'
    const subCls = isGold ? 'text-black/60' : 'text-white/50'
    const numBg = isGold ? 'bg-black/10' : 'bg-white/10'

    return (
        <section className={`py-16 px-8 ${bgCls}`}>
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
                <h2 className={`text-2xl md:text-3xl font-serif tracking-widest ${textCls}`}>{heading}</h2>
                {subheading && <p className={`text-sm leading-relaxed ${subCls}`}>{subheading}</p>}
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
                {cta_text && (
                    <a href={cta_link}
                        className={`inline-block border px-8 py-3 text-xs uppercase tracking-[0.3em] transition-all duration-300 
                            ${isGold ? 'border-black text-black hover:bg-black hover:text-[#D4AF37]' : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}>
                        {cta_text}
                    </a>
                )}
            </div>
        </section>
    )
}
