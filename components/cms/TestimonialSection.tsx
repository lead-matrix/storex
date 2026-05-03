
'use client'
import { TestimonialProps } from '@/lib/builder/types'

export default function TestimonialSection({ quote, author, role }: TestimonialProps) {
    return (
        <section className="py-20 px-8 bg-zinc-950">
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
                <span className="text-[#D4AF37] text-4xl font-serif">"</span>
                <p className="text-white text-xl font-serif italic leading-relaxed tracking-wide">{quote}</p>
                <div className="w-10 border-t border-[#D4AF37]" />
                <div>
                    <p className="text-white font-medium text-sm uppercase tracking-widest">{author}</p>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">{role}</p>
                </div>
            </div>
        </section>
    )
}
