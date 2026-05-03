import Image from "next/image";
import { ImageBannerProps } from "@/lib/builder/types";

export default function ImageBannerSection({
    image_url,
    caption,
    height = "md",
}: ImageBannerProps) {
    const heightCls = {
        sm: 'h-[40vh]',
        md: 'h-[60vh]',
        lg: 'h-[80vh]',
        full: 'h-screen'
    }[height] || 'h-[60vh]';

    return (
        <section className={`relative w-full overflow-hidden ${heightCls}`}>
            {/* Background Image */}
            {image_url ? (
                <Image
                    src={image_url}
                    alt={caption || "Banner"}
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
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            {caption && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <p className="text-white text-lg md:text-xl font-serif italic tracking-wide drop-shadow-lg">
                        {caption}
                    </p>
                </div>
            )}

            {/* Fine line Ornament */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </section>
    );
}
