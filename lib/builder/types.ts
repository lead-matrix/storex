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
    target_date: string // ISO string e.g. "2026-05-01T00:00:00"
    cta_text: string
    cta_link: string
    bg_color: 'black' | 'gold' | 'dark'
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
    icon_1: string
    label_1: string
    icon_2: string
    label_2: string
    icon_3: string
    label_3: string
    icon_4: string
    label_4: string
}

export interface FaqAccordionProps {
    heading: string
    q1: string
    a1: string
    q2: string
    a2: string
    q3: string
    a3: string
    q4: string
    a4: string
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
        description: 'Autoplay background video with headline & CTA',
        icon: '🎬',
        defaultProps: {
            mux_playback_id: '',
            heading: 'The Obsidian Ritual',
            subheading: 'Experience the transformation.',
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
        type: 'before_after',
        label: 'Before / After',
        description: 'Drag-slider comparing two images side by side',
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
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to a sale or launch date',
        icon: '⏳',
        defaultProps: {
            heading: 'Sale Ends In',
            subheading: 'Limited time offer — do not miss out.',
            target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            cta_text: 'Shop the Sale',
            cta_link: '/sale',
            bg_color: 'dark',
        } as CountdownTimerProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: '4 icons with labels — trust signals & brand pillars',
        icon: '✦',
        defaultProps: {
            heading: 'Why Choose Us',
            icon_1: '🚚',
            label_1: 'Free Shipping',
            icon_2: '🌿',
            label_2: 'Cruelty Free',
            icon_3: '🌱',
            label_3: '100% Vegan',
            icon_4: '♻️',
            label_4: 'Eco Packaging',
        } as IconGridProps,
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
        description: 'Collapsible Q&A — reduces support, great for SEO',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            q1: 'What ingredients do you use?',
            a1: 'We use only the finest natural and ethically sourced ingredients.',
            q2: 'Do you ship internationally?',
            a2: 'Yes, we ship worldwide. International orders typically arrive in 7–14 business days.',
            q3: 'What is your return policy?',
            a3: 'We offer a 30-day satisfaction guarantee on all products.',
            q4: 'Are your products tested on animals?',
            a4: 'Never. All our products are cruelty-free and certified vegan.',
        } as FaqAccordionProps,
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
        type: 'divider',
        label: 'Divider',
        description: 'Visual separator between sections',
        icon: '➖',
        defaultProps: {
            style: 'ornament',
        } as DividerProps,
    },
]
