import { createClient } from "@/lib/supabase/server"
import AnnouncementBar from "@/components/AnnouncementBar"
import SplitHero from "@/components/home/SplitHero"
import TrustBar from "@/components/home/TrustBar"
import SocialProof from "@/components/home/SocialProof"
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid"
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid"
import { NewsletterSection } from "@/features/home/components/NewsletterSection"
import CMSRenderer from "@/components/cms/CMSRenderer"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "DINA COSMETIC | Premium Beauty",
  description: "Premium beauty formulations for those who demand absolute excellence. Shop lipstick, foundation, eyeshadow and more.",
}

export default async function Home() {
  const supabase = await createClient()

  // Check for CMS-driven home page
  const { data: homePage } = await supabase
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("slug", "home")
    .eq("is_published", true)
    .maybeSingle()

  // If CMS page exists with sections, render it (admin override)
  if (homePage?.cms_sections?.length > 0) {
    const sections = [...homePage.cms_sections]
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map((s) => ({ type: s.type, props: s.props }))

    return (
      <main className="bg-[#FAFAF8]">
        <AnnouncementBar />
        <CMSRenderer sections={sections} />
      </main>
    )
  }

  // Default curated layout
  let products: any[] = []
  let categories: any[] = []
  let announcementMessages: string[] | undefined
  let homeConfig: any = {}

  try {
    const [productsRes, categoriesRes, announcementRes, homeSectionsRes] = await Promise.all([
      // Fetch based on curation settings
      (async () => {
        const { data: hConfig } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'home_sections').maybeSingle();
        const config = hConfig?.setting_value || {};
        homeConfig = config;

        let query = supabase
          .from("products")
          .select(`
            id, title, slug, base_price, sale_price, on_sale, is_new,
            is_bestseller, images, description, status,
            product_variants (id, name, price_override, stock, status, color_code, image_url)
          `)
          .eq("status", "active");

        if (config.show_bestsellers_hero) {
          query = query.eq("is_bestseller", true);
        } else {
          query = query.eq("is_featured", true);
        }

        return query.order("created_at", { ascending: false }).limit(8);
      })(),
      supabase
        .from("categories")
        .select("id, name, slug, description, image_url")
        .limit(6),
      supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "announcement_messages")
        .maybeSingle(),
      supabase.from('site_settings').select('setting_value').eq('setting_key', 'home_sections').maybeSingle()
    ])

    products = (productsRes as any).data || []
    categories = categoriesRes.data || []

    if (announcementRes.data?.setting_value?.messages) {
      announcementMessages = announcementRes.data.setting_value.messages
    }
  } catch (err) {
    console.error("Home page fetch error:", err)
  }

  return (
    <div className="bg-[#FAFAF8]">
      {/* Announcement bar — above everything */}
      <AnnouncementBar messages={announcementMessages} />

      {/* Split hero — product photo + copy */}
      <SplitHero />

      {/* Trust bar — 4 signals */}
      <TrustBar variant="light" />

      {/* Category navigation */}
      {categories.length > 0 && (
        <section className="bg-white py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold mb-3">Shop By Category</p>
              <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A]">Explore Collections</h2>
            </div>
            <HomeCategoryGrid categories={categories} />
          </div>
        </section>
      )}

      {/* Featured products — light background */}
      <section className="bg-[#FAFAF8] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold mb-3">Bestsellers</p>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A]">Featured Products</h2>
          </div>
          <FeaturedProductsGrid products={products.slice(0, 4)} />
        </div>
      </section>

      {/* Social proof — reviews + press */}
      <SocialProof />

      {/* Second product row */}
      {products.length > 4 && (
        <section className="bg-white py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold mb-3">New Arrivals</p>
              <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A]">Just Landed</h2>
            </div>
            <FeaturedProductsGrid products={products.slice(4, 8)} />
          </div>
        </section>
      )}

      {/* Editorial banner */}
      <section className="bg-[#1A1A1A] py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-[11px] uppercase tracking-[0.5em] text-[#D4AF37] font-bold">The Obsidian Standard</p>
          <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight italic">
            "Beauty is the illumination of your soul"
          </h2>
          <p className="text-[#FFFFFF]/60 leading-relaxed">
            Every DINA COSMETIC formulation is crafted for those who see beauty as a ritual, not a routine.
          </p>
          <a
            href="/about"
            className="inline-flex items-center gap-3 border border-[#D4AF37] text-[#D4AF37] px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
          >
            Our Story
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  )
}
