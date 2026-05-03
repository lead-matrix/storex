
'use client'
import { VideoHeroProps } from '@/lib/builder/types'

export default function VideoHero({ mux_playback_id, heading, subheading, cta_text, cta_link, overlay_opacity }: VideoHeroProps) {
    const videoSrc = mux_playback_id
        ? `https://stream.mux.com/${mux_playback_id}/low.mp4`
        : null
    return (
        <section className="relative w-full h-[60vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-black">
            {videoSrc ? (
                <video
                    src={videoSrc}
                    autoPlay muted loop playsInline
                    aria-hidden="true"
                    poster={`https://image.mux.com/${mux_playback_id}/thumbnail.jpg?time=0`}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest">Add Mux Playback ID in settings</span>
                </div>
            )}
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(overlay_opacity ?? 40) / 100})` }} />
            <div className="relative z-10 text-center px-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
                <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest leading-tight">{heading}</h1>
                <p className="text-sm text-white/70 uppercase tracking-[0.25em] max-w-xl leading-relaxed">{subheading}</p>
                <a href={cta_link} className="inline-block border border-white text-white text-xs uppercase tracking-[0.3em] px-8 py-3 hover:bg-white hover:text-black transition-all duration-300">
                    {cta_text}
                </a>
            </div>
        </section>
    )
}
