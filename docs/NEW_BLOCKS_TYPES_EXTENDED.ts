// ─────────────────────────────────────────────────────────────────────────────
// Extended Block Types — add these to lib/builder/types.ts
// Adds 5 new blocks: Video Hero, Countdown Timer, Before/After, Icon Grid, FAQ
// ─────────────────────────────────────────────────────────────────────────────

// Add to BlockType union:
export type BlockType =
    | 'hero'
    | 'text_block'
    | 'image_banner'
    | 'product_shelf'
    | 'two_column'
    | 'newsletter'
    | 'divider'
    | 'testimonial'
    // ─── NEW BLOCKS ───
    | 'video_hero'
    | 'countdown_timer'
    | 'before_after'
    | 'icon_grid'
    | 'faq_accordion'

// ─────────────────────────────────────────────────────────────────────────────
// NEW PROP INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface VideoHeroProps {
    mux_playback_id: string  // From Mux video library
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    overlay_opacity: number  // 0–100
    autoplay: boolean
}

export interface CountdownTimerProps {
    end_date: string  // ISO 8601: "2025-05-15T23:59:59Z"
    heading: string
    subheading: string
    urgent_color: 'red' | 'orange' | 'gold'  // urgency indicator
    show_labels: boolean  // "Days", "Hours", etc
}

export interface BeforeAfterProps {
    before_image_url: string
    after_image_url: string
    before_label: string
    after_label: string
    height: 'sm' | 'md' | 'lg'
}

export interface IconGridProps {
    items: Array<{
        id: string
        icon: string  // emoji or icon name
        label: string
        description: string
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

// Update BlockProps union to include new props:
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

// ─────────────────────────────────────────────────────────────────────────────
// Add to BLOCK_CATALOGUE array
// ─────────────────────────────────────────────────────────────────────────────

// Insert these into the BLOCK_CATALOGUE array (after divider, before closing bracket):

/*
    {
        type: 'video_hero',
        label: 'Video Hero',
        description: 'Full-screen Mux video background with overlay text & CTA',
        icon: '🎬',
        defaultProps: {
            mux_playback_id: '',
            heading: 'The Ultimate Experience',
            subheading: 'A curated visual journey.',
            cta_text: 'Discover',
            cta_link: '/shop',
            overlay_opacity: 40,
            autoplay: true,
        } as VideoHeroProps,
    },
    {
        type: 'countdown_timer',
        label: 'Countdown Timer',
        description: 'Live countdown to a deadline (sale ends, event, etc)',
        icon: '⏱️',
        defaultProps: {
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            heading: 'Flash Sale Ends In',
            subheading: 'Exclusive access for members only',
            urgent_color: 'gold',
            show_labels: true,
        } as CountdownTimerProps,
    },
    {
        type: 'before_after',
        label: 'Before/After Slider',
        description: 'Drag to compare two images (perfect for cosmetics results)',
        icon: '↔️',
        defaultProps: {
            before_image_url: '',
            after_image_url: '',
            before_label: 'Before',
            after_label: 'After',
            height: 'md',
        } as BeforeAfterProps,
    },
    {
        type: 'icon_grid',
        label: 'Icon Grid',
        description: 'Trust signals (Free Shipping, Cruelty Free, Vegan, etc)',
        icon: '⭐',
        defaultProps: {
            items: [
                { id: '1', icon: '🚚', label: 'Free Shipping', description: 'On orders over $50' },
                { id: '2', icon: '🐰', label: 'Cruelty Free', description: 'Never tested on animals' },
                { id: '3', icon: '🌱', label: 'Vegan', description: '100% plant-based formulas' },
                { id: '4', icon: '♻️', label: 'Sustainable', description: 'Eco-friendly packaging' },
            ],
            columns: 4,
        } as IconGridProps,
    },
    {
        type: 'faq_accordion',
        label: 'FAQ Accordion',
        description: 'Collapsible Q&A section (great for SEO & support)',
        icon: '❓',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            items: [
                { id: '1', question: 'What are your ingredients?', answer: 'All our products are made from organic, ethically sourced ingredients...' },
                { id: '2', question: 'How long does shipping take?', answer: 'We offer free standard shipping (5-7 business days) and express options...' },
                { id: '3', question: 'Can I return a product?', answer: 'Yes! We offer a 30-day satisfaction guarantee on all purchases...' },
            ],
        } as FAQAccordionProps,
    },
*/
