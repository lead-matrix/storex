import { createClient } from "@/lib/supabase/server"
import CMSRenderer from "@/components/cms/CMSRenderer"
import { SaleHeroSlider } from "@/components/SaleHeroSlider"
import { BentoFeaturedGrid } from "@/components/BentoFeaturedGrid"
import { CollectionShowcase } from "@/components/CollectionShowcase"
import { NewsletterSection } from "@/features/home/components/NewsletterSection"
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid"
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid"
import { BestSellersSlider } from "@/components/BestSellersSlider"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "DINA COSMETIC | The Radiant Atelier",
  description: "Exquisite beauty rituals curated for the modern aesthetic. Explore the Radiant Atelier collections.",
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
  let bestsellerProducts: any[] = []
  let homeSettings: any = {}

  try {
    const [productsRes, categoriesRes, saleRes, bestsellersRes, settingsRes] = await Promise.all([
      supabase
        .from("products")
        .select(`
          id, title, slug, base_price, sale_price, on_sale, is_new, is_besteller, images, description, status,
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
      // Bestsellers: is_bestseller flagged products, up to 12
      supabase
        .from("products")
        .select(`
          id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, status,
          product_variants (id, name, price_override, stock, status)
        `)
        .eq("status", "active")
        .eq("is_bestseller", true)
        .order("created_at", { ascending: false })
        .limit(12),
      // Home section config (headings, visibility toggles set in admin)
      supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "home_sections")
        .maybeSingle(),
    ])

    products = productsRes.data || []
    categories = categoriesRes.data || []
    homeSettings = settingsRes.data?.setting_value || {}

    // Ensure we only include products with a valid sale price
    saleProducts = (saleRes.data || []).filter(p => typeof p.sale_price === 'number' && p.sale_price > 0)

    // If no explicitly flagged bestsellers, fall back to featured products
    bestsellerProducts = bestsellersRes.data || []
    if (bestsellerProducts.length === 0) {
      bestsellerProducts = products.slice(0, 8)
    }
  } catch (err) {
    console.error("Legacy Layout Fetch Error:", err)
  }

  // Map categories to shape CollectionShowcase expects
  const collections = categories.map((c: any) => ({
    ...c,
    product_count: c.product_count?.[0]?.count || 0
  }))

  const showBestsellers = homeSettings.show_bestsellers !== false // default true
  const bestsellerHeading = homeSettings.bestseller_heading || 'Obsidian Bestsellers'
  const bestsellerSubheading = homeSettings.bestseller_subheading || 'Most-loved by our community'

  return (
    <div className="bg-black">
      {/* Hero — custom auto sliding sale slider */}
      {homeSettings.show_bestsellers_hero ? (
        <SaleHeroSlider products={bestsellerProducts} mode="bestseller" />
      ) : (
        <SaleHeroSlider products={saleProducts} mode="sale" />
      )}

      {/* Category navigation grid */}
      <HomeCategoryGrid categories={categories} />

      {/* ── Bestsellers Auto-Scrolling Slider ── */}
      {showBestsellers && bestsellerProducts.length > 0 && (
        <BestSellersSlider
          products={bestsellerProducts}
          heading={bestsellerHeading}
          subheading={bestsellerSubheading}
        />
      )}

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
