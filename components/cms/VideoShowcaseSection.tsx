import VideoPlayer from "../VideoPlayer";

interface VideoShowcaseProps {
    playbackId: string;
    title?: string;
    subtitle?: string;
    autoPlay?: boolean | number;
}

export default function VideoShowcaseSection({
    playbackId,
    title,
    subtitle,
    autoPlay = 1,
}: VideoShowcaseProps) {
    return (
        <section className="relative w-full overflow-hidden bg-black/95 py-24 border-y border-white/5">
            <div className="max-w-[1400px] mx-auto px-6">
                {(title || subtitle) && (
                    <div className="text-center mb-12 animate-luxury-fade space-y-4">
                        {subtitle && (
                            <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
                                {title}
                            </h2>
                        )}
                    </div>
                )}
                
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group max-w-5xl mx-auto">
                    {playbackId ? (
                        <VideoPlayer
                            playbackId={playbackId}
                            autoPlay={!!autoPlay}
                            muted={!!autoPlay}
                            loop={!!autoPlay}
                            controls={!autoPlay}
                            aspectClass="aspect-video"
                        />
                    ) : (
                        <div className="aspect-video w-full bg-neutral-950 flex flex-col items-center justify-center space-y-3">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-film"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
                            </div>
                            <p className="text-white/20 uppercase tracking-widest text-[9px] font-bold">Awaiting Video Configuration</p>
                        </div>
                    )}
                    
                    {/* Decorative overlay */}
                    <div className="absolute inset-0 border border-white/5 pointer-events-none mix-blend-overlay rounded-2xl" />
                </div>
            </div>
        </section>
    );
}
