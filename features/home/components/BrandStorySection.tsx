import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function BrandStorySection() {
    return (
        <section className="section-padding bg-charcoal text-pearl relative overflow-hidden">
            <div className="absolute inset-0 bg-charcoal">
                <div className="absolute opacity-10 right-0 bottom-0 translate-x-1/4 translate-y-1/4">
                    {/* Subtle logo watermark or geometric shape */}
                    <svg width="400" height="400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="49" stroke="#C6A85C" strokeWidth="0.5" />
                        <path d="M50 10 L90 90 L10 90 Z" stroke="#C6A85C" strokeWidth="0.5" />
                    </svg>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="md:w-1/2 w-full animate-slide-up">
                    <div className="relative aspect-[4/5] rounded-luxury overflow-hidden border border-gold/10">
                        <Image
                            src="/story-image.jpg"
                            alt="The Obsidian Palace Story"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="md:w-1/2 w-full flex flex-col items-center md:items-start text-center md:text-left animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-3xl md:text-5xl font-heading tracking-luxury mb-6 text-pearl">
                        The Essence of <br />
                        <span className="text-gold italic">Obsidian Masterpiece</span>
                    </h2>

                    <p className="text-sm md:text-base tracking-luxury leading-loose text-textsoft mb-8 max-w-lg">
                        Born from the pursuit of absolute perfection, DINA COSMETIC introduces a new paradigm in luxury beauty. Our formulations combine rare, ethically sourced ingredients with cutting-edge science to deliver transformative results wrapped in unparalleled elegance.
                    </p>

                    <Link href="/about">
                        <Button variant="luxury" className="uppercase text-xs tracking-luxury text-pearl border-pearl hover:bg-pearl hover:text-charcoal px-8 transition-colors">
                            Discover Our Heritage
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
