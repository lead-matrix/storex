'use client'
import { motion } from "framer-motion"
import Image from "next/image"

interface HeroProps {
    title: string
    subtitle: string
    imageUrl?: string
}

export default function HeroSection({ title, subtitle, imageUrl }: HeroProps) {
    return (
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-black">
            {imageUrl && (
                <div className="absolute inset-0 z-0">
                    <div className="relative h-full w-full">
                        <Image
                            src={imageUrl}
                            alt={title || "Hero"}
                            fill
                            className="object-cover opacity-60"
                            priority
                            sizes="100vw"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-obsidian" />
                </div>
            )}

            <div className="relative z-10 text-center space-y-8 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-8xl font-serif text-white tracking- luxury leading-tight uppercase text-shadow-gold">
                        {title}
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="w-12 h-px bg-gold/50" />
                    <p className="text-[11px] md:text-sm uppercase tracking-[0.5em] text-gold font-bold">
                        {subtitle}
                    </p>
                </motion.div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
                <span className="text-[9px] uppercase tracking-widest text-white">Scroll into Essence</span>
                <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent" />
            </div>
        </section>
    )
}
