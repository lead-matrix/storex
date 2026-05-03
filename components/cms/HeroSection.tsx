'use client'
import { MasterpieceHero } from "../MasterpieceHero";
import { HeroProps } from "@/lib/builder/types";

export default function HeroSection({ heading, subheading, cta_text, cta_link, image_url, overlay_opacity }: HeroProps) {
    const slides = [{
        id: 'cms-hero-1',
        image: image_url || "/products/Banner-1.jpg",
        title: heading,
        subtitle: subheading,
        buttonText: cta_text || "Discover Collection",
        link: cta_link || "/shop"
    }];
    
    // Note: MasterpieceHero might need to be updated to support overlay_opacity if it doesn't already.
    // For now we pass the slides which contain the essential text/image.
    return <MasterpieceHero initialSlides={slides} />;
}
