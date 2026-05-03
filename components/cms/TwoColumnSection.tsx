
'use client'
import { TwoColumnProps } from '@/lib/builder/types'

export default function TwoColumnSection({ 
    left_image, 
    right_heading, 
    right_body, 
    right_cta_text, 
    right_cta_link, 
    image_side 
}: TwoColumnProps) {
    const img = (
        <div className="flex-1 min-h-[300px] bg-zinc-900 relative overflow-hidden">
            {left_image
                ? <img src={left_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest">Image URL</div>
            }
        </div>
    )
    const text = (
        <div className="flex-1 bg-black py-16 px-10 flex flex-col justify-center gap-5">
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-wide">{right_heading}</h2>
            <p className="text-white/60 leading-relaxed text-sm">{right_body}</p>
            <a href={right_cta_link} className="self-start border border-[#D4AF37] text-[#D4AF37] text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#D4AF37] hover:text-black transition-all">
                {right_cta_text}
            </a>
        </div>
    )
    return (
        <section className="flex flex-col md:flex-row w-full">
            {image_side === 'left' ? <>{img}{text}</> : <>{text}{img}</>}
        </section>
    )
}
