// ─────────────────────────────────────────────────────────────────────────────
// Page Builder — Shared Types
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
// 5 NEW BLOCKS
// ────────────────────────────────────────────────────────────────────────────

export interface VideoHeroProps {
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    mux_video_url: string // Mux streaming URL
    overlay_opacity: number // 0–100
    autoplay: boolean
}

export interface CountdownTimerProps {
    heading: string
    subheading: string
    end_date: string // ISO 8601 format: "2024-12-25T23:59:59"
    cta_text: string
    cta_link: string
    bg_color: 'black' | 'gold' | 'dark_gray'
}

export interface BeforeAfterProps {
    before_image: string
    after_image: string
    caption: string
    height: 'sm' | 'md' | 'lg'
}

export interface IconGridProps {
    heading: string
    columns: number // 2, 3, or 4
    items: Array<{
        icon: string // emoji or icon name
        label: string
        description: string
    }>
}

export interface FAQAccordionProps {
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

// Catalogue of available blocks shown in the sidebar
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
        description: 'Autoplay video background with text overlay',
        icon: '🎬',
        defaultProps: {
            heading: 'The Ritual Experience',
            subheading: 'Watch the transformation unfold.',
            cta_text: 'Shop Now',
            cta_link: '/shop',
            mux_video_url: '',
            overlay_opacity: 40,
            autoplay: true,
        } as VideoHeroProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to sale end with urgency messaging',
        icon: '⏱️',
        defaultProps: {
            heading: 'The Obsidian Sale',
            subheading: 'Limited time. Exclusive access.',
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59',
            cta_text: 'Shop Before It Ends',
            cta_link: '/sale',
            bg_color: 'black',
        } as CountdownTimerProps,
    },
    {
        type: 'before_after',
        label: 'Before/After Slider',
        description: 'Drag slider to compare two images (perfect for cosmetics results)',
        icon: '↔️',
        defaultProps: {
            before_image: '',
            after_image: '',
            caption: 'Results after 30 days',
            height: 'md',
        } as BeforeAfterProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: 'Trust signals with icons (Free Shipping, Cruelty Free, etc.)',
        icon: '⭐',
        defaultProps: {
            heading: 'Why Choose Us',
            columns: 4,
            items: [
                { icon: '🚚', label: 'Free Shipping', description: 'On orders over $50' },
                { icon: '🐰', label: 'Cruelty Free', description: 'Never tested on animals' },
                { icon: '♻️', label: 'Sustainable', description: 'Eco-friendly packaging' },
                { icon: '✨', label: 'Luxury Quality', description: 'Premium ingredients' },
            ],
        } as IconGridProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible questions & answers (reduces support, good for SEO)',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: [
                { question: 'How long does shipping take?', answer: 'We ship within 2-3 business days. Standard delivery is 5-7 days. Express available.' },
                { question: 'Is this product vegan?', answer: 'Yes, all our products are 100% vegan and cruelty-free.' },
                { question: 'What if I\'m not satisfied?', answer: 'We offer a 30-day money-back guarantee on all purchases.' },
            ],
        } as FAQAccordionProps,
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
]
