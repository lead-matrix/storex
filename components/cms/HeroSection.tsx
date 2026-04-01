'use client'
import { MasterpieceHero } from "../MasterpieceHero";

interface HeroProps {
    title: string
    subtitle: string
    slide1_url?: string
    slide2_url?: string
    slide3_url?: string
}

export default function HeroSection({ title, subtitle, slide1_url, slide2_url, slide3_url }: HeroProps) {
    const customImages = [slide1_url, slide2_url, slide3_url].filter(img => img && img.trim() !== '');
    const hasOverride = title && title !== "New Experience";
    
    // If no custom images provided but an override is present, use default.
    const finalImages = customImages.length > 0 ? customImages : ["/products/Banner-1.jpg"];

    const slides = hasOverride ? finalImages.map((img, i) => ({
        id: `cms-hero-${i}`,
        image: img as string,
        title: title,
        subtitle: subtitle,
        buttonText: "Discover Collection",
        link: "/shop"
    })) : undefined;

    return <MasterpieceHero initialSlides={slides} />;
}
