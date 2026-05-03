'use client'
import { MasterpieceHero } from "../MasterpieceHero";

// Accepts BOTH naming conventions:
// - New builder (lib/builder/types.ts): heading, subheading, cta_text, cta_link, image_url
// - Legacy CMSRenderer (stored in DB): title, subtitle, ctaText, ctaLink, imageUrl, slide1_url etc.
interface HeroSectionProps {
    // New builder props
    heading?: string
    subheading?: string
    cta_text?: string
    cta_link?: string
    image_url?: string
    overlay_opacity?: number
    // Legacy CMS DB props
    title?: string
    subtitle?: string
    ctaText?: string
    ctaLink?: string
    imageUrl?: string
    slide1_url?: string
    slide2_url?: string
    slide3_url?: string
}

export default function HeroSection(props: HeroSectionProps) {
    const {
        heading, subheading, cta_text, cta_link, image_url,
        title, subtitle, ctaText, ctaLink, imageUrl,
        slide1_url, slide2_url, slide3_url,
    } = props

    // Resolve to whichever naming convention is present
    const resolvedTitle = heading || title || "New Experience"
    const resolvedSubtitle = subheading || subtitle || ""
    const resolvedCta = cta_text || ctaText || "Discover Collection"
    const resolvedLink = cta_link || ctaLink || "/shop"

    // Build slides: if legacy multi-slide URLs exist, use them; otherwise single image
    const imageList = [slide1_url, slide2_url, slide3_url, image_url, imageUrl]
        .filter((img): img is string => !!img && img.trim() !== '')

    const images = imageList.length > 0 ? imageList : ["/products/Banner-1.jpg"]

    const slides = images.map((img, i) => ({
        id: `cms-hero-${i}`,
        image: img,
        title: resolvedTitle,
        subtitle: resolvedSubtitle,
        buttonText: resolvedCta,
        link: resolvedLink,
    }))

    return <MasterpieceHero initialSlides={slides} />
}
