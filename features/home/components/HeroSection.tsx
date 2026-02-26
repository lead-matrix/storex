import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
    content: {
        heading: string
        subheading: string
        cta_text: string
        cta_link: string
        image_url: string
    }
}

export function HeroSection({ content }: HeroSectionProps) {
    return (
        <section className="relative h-[85vh] w-full min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={content.image_url || "/hero-default.jpg"}
                    alt="Hero background"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Subtle dark gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent mix-blend-multiply" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center animate-luxury-fade">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading text-white mb-6 tracking-luxury leading-tight font-medium drop-shadow-md">
                    {content.heading}
                </h1>
                <p className="text-sm md:text-base text-pearl/90 max-w-2xl uppercase tracking-luxury mb-10 leading-relaxed font-light drop-shadow-sm">
                    {content.subheading}
                </p>
                <Link href={content.cta_link || "/shop"}>
                    <Button variant="luxury" size="lg" className="uppercase text-xs tracking-luxury font-medium border-white text-white hover:bg-white hover:text-charcoal bg-white/5 backdrop-blur-sm transition-all duration-500 min-w-[200px]">
                        {content.cta_text || "Discover Collection"}
                    </Button>
                </Link>
            </div>
        </section>
    )
}
