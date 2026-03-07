import React from 'react'

export interface HeroProps {
    title?: string
    subtitle?: string
    image?: string
}

export default function Hero({ title, subtitle, image }: HeroProps) {
    return (
        <section className="relative w-full h-[60vh] flex items-center justify-center bg-zinc-900 text-white overflow-hidden">
            {image && (
                <img
                    src={image}
                    alt={title || "Hero Background"}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
            )}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                {title && <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-4">{title}</h1>}
                {subtitle && <p className="text-xl md:text-2xl font-light text-zinc-300">{subtitle}</p>}
            </div>
        </section>
    )
}
