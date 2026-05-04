'use client'
import HeroSection from "./HeroSection";
import ProductGridSection from "./ProductGridSection";
import PhilosophyBlock from "./PhilosophyBlock";
import ImageBannerSection from "./ImageBannerSection";
import PhilosophyGrid from "./PhilosophyGrid";
import ContactSection from "./ContactSection";
import VideoShowcaseSection from "./VideoShowcaseSection";
import { VideoHero, CountdownTimer, BeforeAfter, IconGrid, FAQAccordion } from "./NewBlocks";

interface Section {
    type: string
    props: any
}

const COMPONENT_MAP: Record<string, React.FC<any>> = {
    hero: HeroSection,
    productGrid: ProductGridSection,
    richText: PhilosophyBlock,
    imageBanner: ImageBannerSection,
    philosophyGrid: PhilosophyGrid,
    contactForm: ContactSection,
    videoBlock: VideoShowcaseSection,
    // New builder blocks
    videoHero: VideoHero,
    countdownTimer: CountdownTimer,
    beforeAfter: BeforeAfter,
    iconGrid: IconGrid,
    faqAccordion: FAQAccordion,
};

export default function CMSRenderer({ sections }: { sections: Section[] }) {
    return (
        <div className="flex flex-col">
            {sections.map((section, idx) => {
                const Component = COMPONENT_MAP[section.type];
                if (!Component) {
                    console.warn(`Section type "${section.type}" not registered in registry.`);
                    return null;
                }
                return <Component key={idx} {...section.props} />;
            })}
        </div>
    );
}
