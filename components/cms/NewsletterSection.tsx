
'use client'
import { NewsletterProps } from '@/lib/builder/types'

export default function NewsletterSection({ heading, subheading, button_text }: NewsletterProps) {
    return (
        <section className="py-20 px-8 bg-zinc-950 border-t border-zinc-800">
            <div className="max-w-lg mx-auto text-center flex flex-col items-center gap-5">
                <h2 className="text-2xl md:text-3xl font-serif text-white tracking-widest">{heading}</h2>
                <p className="text-white/50 text-sm leading-relaxed">{subheading}</p>
                <div className="flex gap-0 w-full max-w-sm">
                    <input readOnly placeholder="your@email.com" className="flex-1 bg-transparent border border-white/20 px-4 py-2.5 text-white text-xs outline-none placeholder:text-white/30" />
                    <button className="bg-[#D4AF37] text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shrink-0">{button_text}</button>
                </div>
            </div>
        </section>
    )
}
