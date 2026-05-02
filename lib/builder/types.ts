// ─────────────────────────────────────────────────────────────────────────────
// Page Builder — Shared Types (Updated with 5 NEW BLOCKS)
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

// Per-block props maps
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

export interface VideoHeroProps {
    video_url: string
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    overlay_opacity: number
}

export interface CountdownTimerProps {
    end_date: string
    heading: string
    message: string
    cta_text: string
    cta_link: string
}

export interface BeforeAfterProps {
    before_image: string
    after_image: string
    label_before: string
    label_after: string
    caption: string
}

export interface IconGridProps {
    heading: string
    items: Array<{
        icon: string
        label: string
        description: string
    }>
}

export interface FaqAccordionProps {
    heading: string
    items: Array<{
        question: string
        answer: string
    }>
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
        type: 'divider',
        label: 'Divider',
        description: 'Visual separator between sections',
        icon: '➖',
        defaultProps: {
            style: 'ornament',
        } as DividerProps,
    },
    {
        type: 'video_hero',
        label: 'Video Hero',
        description: 'Full-width Mux video background with overlay text & CTA',
        icon: '🎬',
        defaultProps: {
            video_url: '',
            heading: 'Witness The Ritual',
            subheading: 'An intimate look at our signature creation process.',
            cta_text: 'Shop Now',
            cta_link: '/shop',
            overlay_opacity: 40,
        } as VideoHeroProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to a specific date with urgency messaging',
        icon: '⏱️',
        defaultProps: {
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            heading: 'Flash Sale',
            message: 'Ends in',
            cta_text: 'Shop Before It\'s Gone',
            cta_link: '/sale',
        } as CountdownTimerProps,
    },
    {
        type: 'before_after',
        label: 'Before/After',
        description: 'Drag slider comparing two images side by side',
        icon: '↔️',
        defaultProps: {
            before_image: '',
            after_image: '',
            label_before: 'Before',
            label_after: 'After',
            caption: 'See the transformation',
        } as BeforeAfterProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: '3–4 trust signals with icons and labels',
        icon: '⭐',
        defaultProps: {
            heading: 'Why Choose Us',
            items: [
                { icon: '🚚', label: 'Free Shipping', description: 'On orders over $100' },
                { icon: '🐰', label: 'Cruelty Free', description: 'Never tested on animals' },
                { icon: '♻️', label: 'Sustainable', description: 'Eco-conscious packaging' },
                { icon: '✨', label: 'Premium Quality', description: 'Luxury ingredients sourced globally' },
            ],
        } as IconGridProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible Q&A section for support & SEO',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: [
                {
                    question: 'What makes your products different?',
                    answer: 'Our products are formulated with the finest ingredients sourced globally and crafted with absolute precision.',
                },
                {
                    question: 'How long does shipping take?',
                    answer: 'We ship within 1–2 business days. Standard shipping takes 5–7 business days. Express options available.',
                },
                {
                    question: 'What is your return policy?',
                    answer: 'We offer 30-day returns on all unopened products. Customer satisfaction is our absolute priority.',
                },
            ],
        } as FaqAccordionProps,
    },
]
