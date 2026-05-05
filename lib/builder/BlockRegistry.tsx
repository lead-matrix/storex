'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — Renders all 13 block types
// (8 original + 5 new)
// ─────────────────────────────────────────────────────────────────────────────

import type { PageBlock } from './types'
import { Hero, TextBlock, ImageBanner, ProductShelf, TwoColumn, Newsletter, Testimonial, Divider } from '@/components/cms'
import { VideoHero, CountdownTimer, BeforeAfterSlider, IconGrid, FAQAccordion } from './blocks-new'

export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any

    switch (block.type) {
        case 'hero':
            return <Hero p={p} />
        case 'text_block':
            return <TextBlock p={p} />
        case 'image_banner':
            return <ImageBanner p={p} />
        case 'product_shelf':
            return <ProductShelf p={p} />
        case 'two_column':
            return <TwoColumn p={p} />
        case 'newsletter':
            return <Newsletter p={p} />
        case 'testimonial':
            return <Testimonial p={p} />
        case 'divider':
            return <Divider p={p} />
        // NEW BLOCKS
        case 'video_hero':
            return <VideoHero p={p} />
        case 'countdown_timer':
            return <CountdownTimer p={p} />
        case 'before_after':
            return <BeforeAfterSlider p={p} />
        case 'icon_grid':
            return <IconGrid p={p} />
        case 'faq':
            return <FAQAccordion p={p} />
        default:
            return <div className="text-red-500 p-4">Unknown block type: {block.type}</div>
    }
}
