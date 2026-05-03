import Image from "next/image";

// Accepts BOTH naming conventions:
// - New builder (lib/builder/types.ts): image_url, caption, height
// - Legacy CMSRenderer (stored in DB): imageUrl, title, subtitle, ctaText, ctaLink, overlayOpacity
interface ImageBannerSectionProps {
    // New builder props
    image_url?: string
    caption?: string
    height?: 'sm' | 'md' | 'lg' | 'full'
    // Legacy CMS DB props
    imageUrl?: string
    title?: string
    subtitle?: string
    ctaText?: string
    ctaLink?: string
    overlayOpacity?: number
}

export default function ImageBannerSection(props: ImageBannerSectionProps) {
    const {
        image_url, caption, height,
        imageUrl, title, subtitle, ctaText, ctaLink, overlayOpacity,
    } = props

    const resolvedImage = image_url || imageUrl || ""
    const resolvedCaption = caption || subtitle || ""
    const resolvedTitle = title || ""
    const resolvedOverlay = overlayOpacity ?? 0.4
    const resolvedCtaText = ctaText || ""
    const resolvedCtaLink = ctaLink || "/shop"

    const heightCls = {
        sm: 'h-[40vh]',
        md: 'h-[60vh]',
        lg: 'h-[80vh]',
        full: 'h-screen'
    }[height || 'md'] || 'h-[60vh]';

    return (
        <section className={`relative w-full overflow-hidden ${heightCls}`}>
            {resolvedImage ? (
                <Image
                    src={resolvedImage}
                    alt={resolvedTitle || resolvedCaption || "Banner"}
                    fill
                    className="object-cover"
                    priority={true}
                    sizes="100vw"
                    quality={90}
                />
            ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    <p className="text-white/20 uppercase tracking-widest text-xs font-serif">Awaiting Visual Masterpiece</p>
                </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black" style={{ opacity: resolvedOverlay }} />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="max-w-4xl space-y-6">
                    {resolvedCaption && (
                        <p className="text-gold text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold drop-shadow-md">
                            {resolvedCaption}
                        </p>
                    )}
                    {resolvedTitle && (
                        <h2 className="text-4xl md:text-7xl font-serif text-white tracking-tight leading-tight drop-shadow-lg">
                            {resolvedTitle}
                        </h2>
                    )}
                    {resolvedCtaText && resolvedCtaLink && (
                        <div className="pt-8">
                            <a
                                href={resolvedCtaLink}
                                className="inline-block bg-white text-black px-12 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all duration-500"
                            >
                                {resolvedCtaText}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Fine line Ornament */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </section>
    );
}
