import React from 'react'
import Link from 'next/link'

export interface CTAProps {
    text?: string
    link?: string
    headline?: string
    description?: string
}

export default function CTA({ text, link, headline, description }: CTAProps) {
    return (
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950 text-center px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl font-light text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {headline || "Elevate Your Routine"}
                </h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    {description || "Discover the collection crafted for ultimate luxury and everyday wear."}
                </p>
                <div>
                    <Link
                        href={link || "/shop"}
                        className="inline-block px-10 py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 uppercase tracking-widest text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors rounded-full"
                    >
                        {text || "Shop Now"}
                    </Link>
                </div>
            </div>
        </section>
    )
}
