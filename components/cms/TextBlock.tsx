
'use client'
import { TextBlockProps } from '@/lib/builder/types'

const ALIGN = { 
    left: 'text-left items-start', 
    center: 'text-center items-center', 
    right: 'text-right items-end' 
}

export default function TextBlock({ eyebrow, heading, body, align }: TextBlockProps) {
    const cls = ALIGN[align] ?? ALIGN.center
    return (
        <section className="py-20 px-8 bg-black">
            <div className={`max-w-3xl mx-auto flex flex-col ${cls} gap-4`}>
                {eyebrow && <span className="text-[#D4AF37] text-xs uppercase tracking-[0.3em]">{eyebrow}</span>}
                <h2 className="text-3xl md:text-5xl font-serif text-white tracking-wide">{heading}</h2>
                <p className="text-white/60 text-base leading-relaxed max-w-prose">{body}</p>
            </div>
        </section>
    )
}
