'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BlockRegistry — Renders all 13 block types
// (8 original + 5 new)
// ─────────────────────────────────────────────────────────────────────────────

import type { PageBlock } from './types'
import {
  HeroSection as Hero,
  TextBlock,
  ImageBannerSection as ImageBanner,
  ProductGridSection as ProductShelf,
  TwoColumnSection as TwoColumn,
  NewsletterSection as Newsletter,
  TestimonialSection as Testimonial,
  DividerSection as Divider,
} from '@/components/cms'
import { VideoHero, CountdownTimer, BeforeAfterSlider, IconGrid, FAQAccordion } from './blocks-new'

export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any

    switch (block.type) {
        case 'hero':
            return <Hero {...p} />
        case 'text_block':
            return <TextBlock {...p} />
        case 'image_banner':
            return <ImageBanner {...p} />
        case 'product_shelf':
            return <ProductShelf {...p} />
        case 'two_column':
            return <TwoColumn {...p} />
        case 'newsletter':
            return <Newsletter {...p} />
        case 'testimonial':
            return <Testimonial {...p} />
        case 'divider':
            return <Divider {...p} />
        // NEW BLOCKS
        case 'video_hero':
            return <VideoHero {...p} />
        case 'countdown_timer':
            return <CountdownTimer {...p} />
        case 'before_after':
            return <BeforeAfterSlider {...p} />
        case 'icon_grid':
            return <IconGrid {...p} />
        case 'faq':
            return <FAQAccordion {...p} />
        default:
            return <div className="text-red-500 p-4">Unknown block type: {block.type}</div>
    }
}
