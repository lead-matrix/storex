// ─────────────────────────────────────────────────────────────────────────────
// Page Builder — Shared Types  (updated: +5 new blocks)
// ─────────────────────────────────────────────────────────────────────────────

export type BlockType =
    | 'hero'
    | 'text_block'
    | 'image_banner'
    | 'product_shelf'
    | 'two_column'
    | 'newsletter'
    | 'divider'
    | 'testimonial'
    | 'video_hero'
    | 'countdown_timer'
    | 'before_after'
    | 'icon_grid'
    | 'faq_accordion'

export interface HeroProps {
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    image_url: string
    overlay_opacity: number
}

export interface TextBlockProps {
    eyebrow: string
    heading: string
    body: string
    align: 'left' | 'center' | 'right'
}

export interface ImageBannerProps {
    image_url: string
    caption: string
    height: 'sm' | 'md' | 'lg' | 'full'
}

export interface ProductShelfProps {
    heading: string
    filter: 'featured' | 'bestsellers' | 'sale' | 'new'
    count: number
}

export interface TwoColumnProps {
    left_image: string
    right_heading: string
    right_body: string
    right_cta_text: string
    right_cta_link: string
    image_side: 'left' | 'right'
}

export interface NewsletterProps {
    heading: string
    subheading: string
    button_text: string
}

export interface DividerProps {
    style: 'line' | 'dots' | 'ornament'
}

export interface TestimonialProps {
    quote: string
    author: string
    role: string
}

// ── NEW BLOCKS ────────────────────────────────────────────────────────────────

export interface VideoHeroProps {
    mux_playback_id: string
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    overlay_opacity: number
}

export interface CountdownTimerProps {
    heading: string
    subheading: string
    end_date: string
    cta_text: string
    cta_link: string
    background_color: 'black' | 'gold' | 'dark'
}

export interface BeforeAfterProps {
    heading: string
    before_image: string
    after_image: string
    before_label: string
    after_label: string
}

export interface IconGridProps {
    heading: string
    icons: string
}

export interface FaqAccordionProps {
    heading: string
    items: string
}

export type BlockProps =
    | HeroProps
    | TextBlockProps
    | ImageBannerProps
    | ProductShelfProps
    | TwoColumnProps
    | NewsletterProps
    | DividerProps
    | TestimonialProps
    | VideoHeroProps
    | CountdownTimerProps
    | BeforeAfterProps
    | IconGridProps
    | FaqAccordionProps

export interface PageBlock {
    id: string
    type: BlockType
    props: BlockProps
}

export interface PageDocument {
    id: string
    slug: string
    title: string
    blocks: PageBlock[]
    published: boolean
    updated_at: string
}

export interface BlockDefinition {
    type: BlockType
    label: string
    description: string
    icon: string
    defaultProps: BlockProps
}

export const BLOCK_CATALOGUE: BlockDefinition[] = [
    {
        type: 'hero',
        label: 'Full Hero',
        description: 'Large image with headline & CTA button',
        icon: '🖼️',
        defaultProps: {
            heading: 'The Obsidian Collection',
            subheading: 'Precision crafted for absolute excellence.',
            cta_text: 'Discover Now',
            cta_link: '/shop',
            image_url: '',
            overlay_opacity: 50,
        } as HeroProps,
    },
    {
        type: 'video_hero',
        label: 'Video Hero',
        description: 'Autoplay background video with headline & CTA',
        icon: '🎬',
        defaultProps: {
            mux_playback_id: '',
            heading: 'The Ritual Begins',
            subheading: 'A sensory experience crafted for excellence.',
            cta_text: 'Shop Now',
            cta_link: '/shop',
            overlay_opacity: 40,
        } as VideoHeroProps,
    },
    {
        type: 'text_block',
        label: 'Text Block',
        description: 'Eyebrow, headline and rich body paragraph',
        icon: '📄',
        defaultProps: {
            eyebrow: 'Our Philosophy',
            heading: 'Absolute Excellence',
            body: 'Write your story here. This block renders beautiful typographic content.',
            align: 'center',
        } as TextBlockProps,
    },
    {
        type: 'image_banner',
        label: 'Image Banner',
        description: 'Full-width atmospheric image with optional caption',
        icon: '🌄',
        defaultProps: {
            image_url: '',
            caption: '',
            height: 'md',
        } as ImageBannerProps,
    },
    {
        type: 'before_after',
        label: 'Before / After',
        description: 'Drag slider comparing two images — perfect for results',
        icon: '↔️',
        defaultProps: {
            heading: 'See The Transformation',
            before_image: '',
            after_image: '',
            before_label: 'Before',
            after_label: 'After',
        } as BeforeAfterProps,
    },
    {
        type: 'product_shelf',
        label: 'Product Shelf',
        description: 'Auto-curated product grid from your Vault',
        icon: '🛍️',
        defaultProps: {
            heading: 'Featured Artifacts',
            filter: 'featured',
            count: 4,
        } as ProductShelfProps,
    },
    {
        type: 'two_column',
        label: 'Two Column',
        description: 'Image on one side, text + CTA on the other',
        icon: '⬛⬜',
        defaultProps: {
            left_image: '',
            right_heading: 'The Essence of Excellence',
            right_body: 'Crafted from the rarest ingredients for a transformative ritual.',
            right_cta_text: 'Explore',
            right_cta_link: '/about',
            image_side: 'left',
        } as TwoColumnProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: '3–4 trust icons with labels (Free Shipping, Cruelty-Free…)',
        icon: '✨',
        defaultProps: {
            heading: '',
            icons: JSON.stringify([
                { icon: '🚚', label: 'Free Shipping', description: 'On orders over $50' },
                { icon: '🌿', label: 'Cruelty Free', description: 'Never tested on animals' },
                { icon: '♻️', label: 'Sustainable', description: 'Eco-conscious packaging' },
                { icon: '💎', label: 'Premium Quality', description: 'Luxury grade ingredients' },
            ]),
        } as IconGridProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Sale / launch urgency countdown with CTA',
        icon: '⏱️',
        defaultProps: {
            heading: 'Limited Time Offer',
            subheading: 'This exclusive deal ends soon. Do not miss out.',
            end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            cta_text: 'Shop The Sale',
            cta_link: '/sale',
            background_color: 'dark',
        } as CountdownTimerProps,
    },
    {
        type: 'newsletter',
        label: 'Newsletter',
        description: 'Email capture section',
        icon: '✉️',
        defaultProps: {
            heading: 'Join The Obsidian Palace',
            subheading: 'Receive exclusive access to new collections and private events.',
            button_text: 'Subscribe',
        } as NewsletterProps,
    },
    {
        type: 'testimonial',
        label: 'Testimonial',
        description: 'Single quote with author attribution',
        icon: '💬',
        defaultProps: {
            quote: 'The most extraordinary beauty ritual I have ever experienced.',
            author: 'Amara N.',
            role: 'Obsidian Member',
        } as TestimonialProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible Q&A — reduces support tickets & boosts SEO',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: JSON.stringify([
                { question: 'What makes your products different?', answer: 'We use only the finest luxury-grade ingredients sourced from around the world, formulated by expert cosmetic chemists.' },
                { question: 'How long does shipping take?', answer: 'Standard shipping takes 3–5 business days. Express options are available at checkout.' },
                { question: 'Do you offer refunds?', answer: 'Yes — we offer a 30-day satisfaction guarantee. Contact us and we will make it right.' },
                { question: 'Are your products cruelty-free?', answer: 'Absolutely. All products are certified cruelty-free and never tested on animals.' },
            ]),
        } as FaqAccordionProps,
    },
    {
        type: 'divider',
        label: 'Divider',
        description: 'Visual separator between sections',
        icon: '➖',
        defaultProps: {
            style: 'ornament',
        } as DividerProps,
    },
]
