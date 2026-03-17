'use client'
import { MasterpieceHero } from "../MasterpieceHero";

interface HeroProps {
    title: string
    subtitle: string
    imageUrl?: string
}

export default function HeroSection({ title, subtitle, imageUrl }: HeroProps) {
    // If we have an imageUrl from the CMS, we can pass it as a single slide
    // However, if we want total control, we can let MasterpieceHero fetch the global slides
    // if no specific props are provided that override it.
    
    // For now, let's treat the CMS props as an override if they are present and non-default.
    const hasOverride = title && title !== "New Experience";
    
    const singleSlide = hasOverride ? [{
        id: 'cms-hero',
        image: imageUrl || "/products/Banner-1.jpg", 
        title: title,
        subtitle: subtitle,
        buttonText: "Discover Collection",
        link: "/shop"
    }] : undefined;

    return <MasterpieceHero initialSlides={singleSlide} />;
}

