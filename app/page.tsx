import { createClient } from "@/lib/supabase/server"
import CMSRenderer from "@/components/cms/CMSRenderer"
import { Hero } from "@/components/Hero"
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid"
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid"
import { TestimonialSection } from "@/components/TestimonialSection"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "DINA COSMETIC — The Obsidian Palace",
  description: "Luxury obsidian cosmetics — discover the curated collection at The Obsidian Palace.",
}

export default async function Home() {
  const supabase = await createClient()

  // 1. Try CMS-driven home page first (cms_pages with slug 'home')
  const { data: homePage, error: cmsError } = await supabase
    .from("cms_pages")
    .select(`
            *,
            cms_sections(*)
        `)
    .eq("slug", "home")
    .eq("is_published", true)
    .maybeSingle()

  if (cmsError) {
    console.warn("CMS Home Page Fetch Error:", cmsError.message)
  }

  if (homePage && homePage.cms_sections && Array.isArray(homePage.cms_sections) && homePage.cms_sections.length > 0) {
    try {
      const sections = [...homePage.cms_sections]
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
        .map((s) => ({ type: s.type, props: s.props }))

      return (
        <main className="bg-obsidian">
          <CMSRenderer sections={sections} />
        </main>
      )
    } catch (err) {
      console.error("CMS Rendering Error:", err)
      // Fall through to legacy layout
    }
  }

  // 2. Fallback to curated legacy layout if no CMS home exists yet
  let products: any[] = []
  let categories: any[] = []

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, status")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .limit(4),
      supabase
        .from("categories")
        .select("id, name, slug, description, image_url")
        .limit(6),
    ])

    products = productsRes.data || []
    categories = categoriesRes.data || []
  } catch (err) {
    console.error("Legacy Layout Fetch Error:", err)
  }

  return (
    <div className="bg-black">
      <Hero />
      <HomeCategoryGrid categories={categories} />
      <FeaturedProductsGrid products={products.map((p) => ({ ...p, name: p.title }))} />
      <TestimonialSection />
    </div>
  )
}
