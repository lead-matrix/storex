'use client'

import { PageBlock } from '@/lib/builder/types'
import {
    HeroSection,
    TextBlock,
    ImageBannerSection,
    ProductGridSection,
    TwoColumnSection,
    NewsletterSection,
    TestimonialSection,
    DividerSection,
} from '@/components/cms'
import {
    VideoHero,
    CountdownTimer,
    BeforeAfter,
    IconGrid,
    FAQAccordion,
} from '@/lib/builder/new-blocks-render'

// BlockRegistry — renders every block type as a real, styled preview.
export function RenderBlock({ block }: { block: PageBlock }) {
    const p = block.props as any

    switch (block.type) {
        // Original 8 blocks
        case 'hero':
            return <HeroSection heading={p.heading} subheading={p.subheading} cta_text={p.cta_text} cta_link={p.cta_link} image_url={p.image_url} overlay_opacity={p.overlay_opacity} />

        case 'text_block':
            return <TextBlock eyebrow={p.eyebrow} heading={p.heading} body={p.body} align={p.align} />

        case 'image_banner':
            return <ImageBannerSection image_url={p.image_url} caption={p.caption} height={p.height} />

        case 'product_shelf':
            return <ProductGridSection heading={p.heading} filter={p.filter} count={p.count} />

        case 'two_column':
            return <TwoColumnSection left_image={p.left_image} right_heading={p.right_heading} right_body={p.right_body} right_cta_text={p.right_cta_text} right_cta_link={p.right_cta_link} image_side={p.image_side} />

        case 'newsletter':
            return <NewsletterSection heading={p.heading} subheading={p.subheading} button_text={p.button_text} />

        case 'testimonial':
            return <TestimonialSection quote={p.quote} author={p.author} role={p.role} />

        case 'divider':
            return <DividerSection style={p.style} />

        // 5 NEW BLOCKS
        case 'video_hero':
            return <VideoHero heading={p.heading} subheading={p.subheading} cta_text={p.cta_text} cta_link={p.cta_link} mux_video_url={p.mux_video_url} overlay_opacity={p.overlay_opacity} autoplay={p.autoplay} />

        case 'countdown_timer':
            return <CountdownTimer heading={p.heading} subheading={p.subheading} end_date={p.end_date} cta_text={p.cta_text} cta_link={p.cta_link} bg_color={p.bg_color} />

        case 'before_after':
            return <BeforeAfter before_image={p.before_image} after_image={p.after_image} caption={p.caption} height={p.height} />

        case 'icon_grid':
            return <IconGrid heading={p.heading} columns={p.columns} items={p.items} />

        case 'faq_accordion':
            return <FAQAccordion heading={p.heading} items={p.items} />

        default:
            return <div className="p-8 bg-red-900/20 border border-red-500 rounded text-red-400">Unknown block type: {block.type}</div>
    }
}
