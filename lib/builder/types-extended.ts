// ─────────────────────────────────────────────────────────────────────────────
// Extended Block Types — 5 NEW BLOCKS (Video Hero, Countdown, Before/After, Icon Grid, FAQ)
// Adds to the existing 8 blocks for a total of 13
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
    // NEW BLOCKS ↓
    | 'video_hero'
    | 'countdown_timer'
    | 'before_after'
    | 'icon_grid'
    | 'faq_accordion'

// ────────────────────────────────────────────────────────────────────────────
// ORIGINAL PROPS (keep existing)
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// NEW BLOCK PROPS (5 blocks)
// ────────────────────────────────────────────────────────────────────────────

export interface VideoHeroProps {
    video_url: string // Mux video URL or mp4
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    overlay_opacity: number // 0–100
    autoplay: boolean
}

export interface CountdownTimerProps {
    end_date: string // ISO 8601 datetime: "2026-05-15T23:59:59Z"
    heading: string
    message: string // "Sale ends in..."
    background_color: string // hex color #000000
    text_color: string // hex color #FFFFFF
    show_labels: boolean // "Days", "Hours", "Minutes", "Seconds"
}

export interface BeforeAfterProps {
    before_image: string
    after_image: string
    before_label: string // "Before"
    after_label: string // "After"
    initial_position: number // 0–100, default 50
}

export interface IconGridProps {
    heading: string
    items: Array<{
        icon: string // emoji or icon name
        title: string // "Free Shipping"
        description: string // "Worldwide delivery"
    }>
}

export interface FAQAccordionProps {
    heading: string
    items: Array<{
        question: string
        answer: string
    }>
}

// ────────────────────────────────────────────────────────────────────────────
// UNIFIED BLOCK PROPS UNION
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// BLOCK CATALOGUE (13 total)
// ────────────────────────────────────────────────────────────────────────────

export interface BlockDefinition {
    type: BlockType
    label: string
    description: string
    icon: string
    defaultProps: BlockProps
}

export const BLOCK_CATALOGUE: BlockDefinition[] = [
    // ORIGINAL 8
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
    // NEW 5 BLOCKS ↓
    {
        type: 'video_hero',
        label: 'Video Hero',
        description: 'Autoplay video background with text overlay',
        icon: '🎬',
        defaultProps: {
            video_url: '',
            heading: 'Experience the Ritual',
            subheading: 'Watch how excellence is crafted.',
            cta_text: 'Shop Now',
            cta_link: '/shop',
            overlay_opacity: 40,
            autoplay: true,
        } as VideoHeroProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to create urgency',
        icon: '⏱️',
        defaultProps: {
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            heading: 'Exclusive Flash Sale',
            message: 'Offer ends in',
            background_color: '#1a1a1a',
            text_color: '#FFFFFF',
            show_labels: true,
        } as CountdownTimerProps,
    },
    {
        type: 'before_after',
        label: 'Before/After Slider',
        description: 'Drag to compare two images',
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
        description: 'Trust signals with icons and labels',
        icon: '⭐',
        defaultProps: {
            heading: 'Why Choose Us',
            items: [
                { icon: '🚚', title: 'Free Shipping', description: 'Worldwide delivery on orders' },
                { icon: '✨', title: 'Cruelty Free', description: 'No animal testing ever' },
                { icon: '🌱', title: 'Vegan', description: 'Plant-based ingredients' },
                { icon: '♻️', title: 'Sustainable', description: 'Eco-conscious packaging' },
            ],
        } as IconGridProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible Q&A section',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: [
                { question: 'How long does delivery take?', answer: 'Orders ship within 2 business days. Delivery is 5-10 business days worldwide.' },
                { question: 'Is shipping free?', answer: 'Yes, all orders qualify for free worldwide shipping.' },
                { question: 'Can I return products?', answer: 'Absolutely. 30-day money-back guarantee on all purchases.' },
            ],
        } as FAQAccordionProps,
    },
]
