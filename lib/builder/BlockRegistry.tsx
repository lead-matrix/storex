'use client'

// BlockRegistry — renders every block type
import {
    HeroSection, TextBlock, ImageBanner, ProductShelf,
    TwoColumn, Newsletter, Testimonial, Divider,
} from '@/components/cms/index'
import {
    VideoHero, CountdownTimer, BeforeAfter, IconGrid, FAQAccordion,
} from '@/lib/builder/new-blocks-render'
import type { PageBlock } from '@/lib/builder/types-extended'

export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any
    
    switch (block.type) {
        // ORIGINAL 8
        case 'hero':
            return (
                <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
                    {p.image_url && <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black" style={{ opacity: p.overlay_opacity / 100 }} />
                    <div className="relative z-10 max-w-3xl mx-auto px-8 text-center text-white">
                        <h1 className="text-5xl md:text-6xl font-serif mb-4 tracking-wide italic">{p.heading}</h1>
                        <p className="text-lg md:text-xl mb-8 text-white/80 font-light">{p.subheading}</p>
                        <a href={p.cta_link} className="inline-block border border-white text-white text-sm uppercase tracking-[0.2em] px-8 py-4 hover:bg-white hover:text-black transition-all">
                            {p.cta_text}
                        </a>
                    </div>
                </section>
            )

        case 'text_block':
            return (
                <section className="py-20 px-8 bg-black">
                    <div className={`max-w-3xl ${p.align === 'center' ? 'mx-auto' : p.align === 'right' ? 'ml-auto' : ''} text-${p.align}`}>
                        {p.eyebrow && <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-medium">{p.eyebrow}</p>}
                        <h2 className="text-4xl md:text-5xl font-serif text-white mt-2 mb-6 tracking-wide">{p.heading}</h2>
                        <p className="text-white/70 text-lg leading-relaxed max-w-2xl">{p.body}</p>
                    </div>
                </section>
            )

        case 'image_banner':
            return (
                <section className={`relative w-full ${p.height === 'sm' ? 'h-72' : p.height === 'md' ? 'h-96' : p.height === 'lg' ? 'h-[500px]' : 'h-screen'} bg-gray-900 overflow-hidden`}>
                    {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                    {p.caption && <div className="absolute bottom-8 left-8 bg-black/70 text-white px-6 py-3 rounded text-sm">{p.caption}</div>}
                </section>
            )

        case 'product_shelf':
            return (
                <section className="py-16 px-8 bg-black">
                    <div className="max-w-7xl mx-auto flex flex-col items-center">
                        <h2 className="text-3xl md:text-4xl font-serif text-white mb-12 tracking-wide">{p.heading}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                            {[...Array(p.count)].map((_, i) => (
                                <div key={i} className="aspect-square bg-white/10 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                </section>
            )

        case 'two_column':
            return (
                <section className="flex flex-col md:flex-row w-full">
                    {p.image_side === 'left' ? (
                        <>
                            <div className="w-full md:w-1/2">{p.left_image && <img src={p.left_image} alt="" className="w-full h-full object-cover" />}</div>
                            <div className="w-full md:w-1/2 bg-black p-12 flex flex-col justify-center">
                                <h2 className="text-4xl font-serif text-white mb-6">{p.right_heading}</h2>
                                <p className="text-white/70 mb-8 leading-relaxed">{p.right_body}</p>
                                <a href={p.right_cta_link} className="inline-block w-fit border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all">{p.right_cta_text}</a>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-full md:w-1/2 bg-black p-12 flex flex-col justify-center">
                                <h2 className="text-4xl font-serif text-white mb-6">{p.right_heading}</h2>
                                <p className="text-white/70 mb-8 leading-relaxed">{p.right_body}</p>
                                <a href={p.right_cta_link} className="inline-block w-fit border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all">{p.right_cta_text}</a>
                            </div>
                            <div className="w-full md:w-1/2">{p.left_image && <img src={p.left_image} alt="" className="w-full h-full object-cover" />}</div>
                        </>
                    )}
                </section>
            )

        case 'newsletter':
            return (
                <section className="py-20 px-8 bg-black border-t border-white/10">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-serif text-white mb-4">{p.heading}</h2>
                        <p className="text-white/60 mb-8">{p.subheading}</p>
                        <form className="flex gap-2">
                            <input type="email" placeholder="your@email.com" className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/50" required />
                            <button type="submit" className="bg-white text-black px-8 py-3 font-bold hover:bg-white/90 transition-all">{p.button_text}</button>
                        </form>
                    </div>
                </section>
            )

        case 'testimonial':
            return (
                <section className="py-20 px-8 bg-black border-y border-white/10">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-xl md:text-2xl text-white font-light italic mb-8">"{p.quote}"</p>
                        <p className="text-white font-bold">{p.author}</p>
                        <p className="text-white/60 text-sm">{p.role}</p>
                    </div>
                </section>
            )

        case 'divider':
            return (
                <div className="h-px bg-white/10 my-8" />
            )

        // NEW 5 BLOCKS
        case 'video_hero':
            return <VideoHero {...p} />

        case 'countdown_timer':
            return <CountdownTimer {...p} />

        case 'before_after':
            return <BeforeAfter {...p} />

        case 'icon_grid':
            return <IconGrid {...p} />

        case 'faq_accordion':
            return <FAQAccordion {...p} />

        default:
            return <div className="p-8 bg-red-900/20 border border-red-500 text-red-500">Unknown block type: {block.type}</div>
    }
}
