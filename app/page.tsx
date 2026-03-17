import { createClient } from "@/lib/supabase/server"
import CMSRenderer from "@/components/cms/CMSRenderer"
import { SaleHeroSlider } from "@/components/SaleHeroSlider"
import { BentoFeaturedGrid } from "@/components/BentoFeaturedGrid"
import { CollectionShowcase } from "@/components/CollectionShowcase"
import { NewsletterSection } from "@/features/home/components/NewsletterSection"
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid"
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid"
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
  let saleProducts: any[] = []

  try {
    const [productsRes, categoriesRes, saleRes] = await Promise.all([
      supabase
        .from("products")
        .select(`
          id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, status,
          product_variants (id, name, price_override, stock, status)
        `)
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .limit(8),
      supabase
        .from("categories")
        .select("id, name, slug, description, image_url, product_count:products(count)")
        .limit(6),
      supabase
        .from("products")
        .select(`
          id, title, slug, base_price, sale_price, on_sale, images, description, status
        `)
        .eq("status", "active")
        .eq("on_sale", true)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    products = productsRes.data || []
    categories = categoriesRes.data || []
    
    // Ensure we only include products with a valid sale price
    saleProducts = (saleRes.data || []).filter(p => typeof p.sale_price === 'number' && p.sale_price > 0)
  } catch (err) {
    console.error("Legacy Layout Fetch Error:", err)
  }

  // Map categories to shape CollectionShowcase expects
  const collections = categories.map((c: any) => ({
    ...c,
    product_count: c.product_count?.[0]?.count || 0
  }))

  return (
    <div className="bg-black">
      {/* Hero — custom auto sliding sale slider */}
      <SaleHeroSlider products={saleProducts} />

      {/* Category navigation grid */}
      <HomeCategoryGrid categories={categories} />

      {/* Featured products strip (first 4) */}
      <FeaturedProductsGrid products={products.slice(0, 4)} />

      {/* Bento grid (all fetched products, returns null if empty) */}
      <BentoFeaturedGrid products={products} />

      {/* Collection showcase (returns null if empty) */}
      <CollectionShowcase collections={collections} />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  )
}
