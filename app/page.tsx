import { createClient } from "@/utils/supabase/server";
import { HeroSection } from "@/features/home/components/HeroSection";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { BrandStorySection } from "@/features/home/components/BrandStorySection";
import { TrustIndicators } from "@/features/home/components/TrustIndicators";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, base_price, images, description, is_featured")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8);

  return { products: products ?? [] };
}

export default async function Home() {
  const { products } = await getHomePageData();

  const heroContent = {
    heading: "The Obsidian Masterpiece",
    subheading: "Where cutting-edge science meets absolute luxury in every drop.",
    cta_text: "Discover The Collection",
    cta_link: "/shop",
    image_url: "/hero-bg.jpg" // We can assume this exists or use placeholder
  };

  return (
    <div className="bg-pearl min-h-screen pt-16">
      <HeroSection content={heroContent} />
      <TrustIndicators />
      <FeaturedProductsGrid products={products} />
      <BrandStorySection />
      <NewsletterSection />
    </div>
  );
}
