// ─────────────────────────────────────────────────────────────────────────────
// STOREX CMS — EXTENDED BLOCK TYPES (13 total = 8 original + 5 new)
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
    // ──── NEW BLOCKS ────
    | 'video_hero'
    | 'countdown_timer'
    | 'before_after'
    | 'icon_grid'
    | 'faq_accordion'

// ──────────────────────────────────────────────────────────────────────────────
// ORIGINAL 8 BLOCK TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface HeroProps {
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    image_url: string
    overlay_opacity: number // 0–100
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

// ──────────────────────────────────────────────────────────────────────────────
// NEW 5 BLOCK TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface VideoHeroProps {
    video_url: string // Mux video URL
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    overlay_opacity: number // 0–100
    autoplay: boolean
    muted: boolean
}

export interface CountdownTimerProps {
    end_date: string // ISO 8601 datetime
    heading: string
    subheading: string
    background_color: string // hex color
    text_color: string // hex color
    show_labels: boolean
}

export interface BeforeAfterProps {
    before_image: string
    after_image: string
    before_label: string
    after_label: string
    initial_position: number // 0–100, where slider starts
}

export interface IconGridProps {
    items: Array<{
        id: string
        icon: string // emoji or icon name
        label: string
        description?: string
    }>
    columns: 2 | 3 | 4
}

export interface FAQAccordionProps {
    heading: string
    items: Array<{
        id: string
        question: string
        answer: string
    }>
}

// ──────────────────────────────────────────────────────────────────────────────
// UNION TYPES
// ──────────────────────────────────────────────────────────────────────────────

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
    | FAQAccordionProps

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

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK CATALOGUE (13 blocks)
// ──────────────────────────────────────────────────────────────────────────────

export const BLOCK_CATALOGUE: BlockDefinition[] = [
    // ──── ORIGINAL 8 ────
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
    // ──── NEW 5 BLOCKS ────
    {
        type: 'video_hero',
        label: 'Video Hero',
        description: 'Full-screen Mux video with autoplay & overlay text',
        icon: '🎬',
        defaultProps: {
            video_url: '',
            heading: 'Our Story in Motion',
            subheading: 'Experience the ritual.',
            cta_text: 'Shop Now',
            cta_link: '/shop',
            overlay_opacity: 40,
            autoplay: true,
            muted: true,
        } as VideoHeroProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to a specific date (creates urgency)',
        icon: '⏱️',
        defaultProps: {
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            heading: 'Flash Sale Ends Soon',
            subheading: 'Limited time only',
            background_color: '#1a1a1a',
            text_color: '#D4AF37',
            show_labels: true,
        } as CountdownTimerProps,
    },
    {
        type: 'before_after',
        label: 'Before/After Slider',
        description: 'Drag slider to compare two images (perfect for skincare)',
        icon: '↔️',
        defaultProps: {
            before_image: '',
            after_image: '',
            before_label: 'Before',
            after_label: 'After',
            initial_position: 50,
        } as BeforeAfterProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: 'Trust signals: Free Shipping, Cruelty Free, Vegan, etc.',
        icon: '⭐',
        defaultProps: {
            items: [
                { id: '1', icon: '🚚', label: 'Free Shipping', description: 'On orders over $100' },
                { id: '2', icon: '🐰', label: 'Cruelty Free', description: 'Never tested on animals' },
                { id: '3', icon: '🌱', label: 'Vegan', description: 'Plant-based ingredients' },
                { id: '4', icon: '♻️', label: 'Sustainable', description: 'Eco-friendly packaging' },
            ],
            columns: 4,
        } as IconGridProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible Q&A section (reduces support emails)',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: [
                {
                    id: '1',
                    question: 'What is the shipping timeline?',
                    answer: 'Orders ship within 2 business days. Standard shipping arrives in 5-7 business days. Expedited shipping available.',
                },
                {
                    id: '2',
                    question: 'Are your products suitable for sensitive skin?',
                    answer: 'Yes! All products are dermatologist-tested and hypoallergenic. Always do a patch test first.',
                },
                {
                    id: '3',
                    question: 'What is your return policy?',
                    answer: '30-day money-back guarantee on all products. No questions asked.',
                },
            ],
        } as FAQAccordionProps,
    },
]
