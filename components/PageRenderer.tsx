import React from 'react'
import Hero from './sections/Hero'
import ProductGrid from './sections/ProductGrid'
import Banner from './sections/Banner'
import CTA from './sections/CTA'

export interface PageSection {
    id?: string;
    type: string;
    [key: string]: any;
}

export interface PageRendererProps {
    sections: PageSection[];
}

export default function PageRenderer({ sections }: PageRendererProps) {
    if (!sections || !Array.isArray(sections)) {
        return null;
    }

    return (
        <>
            {sections.map((section, index) => {
                // Ensure keys are unique. If the section has an ID, use it, otherwise use index.
                const key = section.id || `section-${index}`

                switch (section.type) {
                    case 'hero':
                        return <Hero key={key} {...section} />

                    case 'product_grid':
                    case 'productGrid':
                        return <ProductGrid key={key} {...section} />

                    case 'banner':
                        return <Banner key={key} {...section} />

                    case 'cta':
                        return <CTA key={key} {...section} />

                    default:
                        if (process.env.NODE_ENV === 'development') {
                            return (
                                <div key={key} className="p-4 border border-red-500 text-red-500 text-center">
                                    Unknown section type: {section.type}
                                </div>
                            )
                        }
                        return null
                }
            })}
        </>
    )
}
