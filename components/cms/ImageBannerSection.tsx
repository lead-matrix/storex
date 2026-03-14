import Image from "next/image";

interface ImageBannerProps {
    imageUrl: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    overlayOpacity?: number;
    height?: string;
}

export default function ImageBannerSection({
    imageUrl,
    title,
    subtitle,
    ctaText,
    ctaLink,
    overlayOpacity = 0.4,
    height = "70vh",
}: ImageBannerProps) {
    return (
        <section className="relative w-full overflow-hidden" style={{ height }}>
            {/* Background Image */}
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || "Banner"}
                    fill
                    className="object-cover"
                    priority={true}
                    fetchPriority="high"
                    sizes="100vw"
                    quality={90}
                />
            ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    <p className="text-white/20 uppercase tracking-widest text-xs font-serif">Awaiting Visual Masterpiece</p>
                </div>
            )}

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: overlayOpacity }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="max-w-4xl space-y-6 animate-luxury-fade">
                    {subtitle && (
                        <p className="text-gold text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold drop-shadow-md">
                            {subtitle}
                        </p>
                    )}

                    {title && (
                        <h2 className="text-4xl md:text-7xl font-serif text-white tracking-tight leading-tight drop-shadow-lg">
                            {title}
                        </h2>
                    )}

                    {ctaText && ctaLink && (
                        <div className="pt-8">
                            <a
                                href={ctaLink}
                                className="inline-block bg-white text-black px-12 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all duration-500 shadow-luxury"
                            >
                                {ctaText}
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
