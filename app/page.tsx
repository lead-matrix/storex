import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/Hero";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid";
import CMSRenderer from "@/components/cms/CMSRenderer";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  // 1. Try to fetch CMS driven home page
  const { data: cmsHome } = await supabase
    .from("cms_pages")
    .select(`*, cms_sections(*)`)
    .eq("slug", "home")
    .eq("is_published", true)
    .order("sort_order", { foreignTable: "cms_sections", ascending: true })
    .single();

  if (cmsHome) return { cmsHome };

  // 2. Fallback to curated legacy layout if no CMS home exists
  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, status")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .limit(4);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .limit(6);

  return {
    products: products?.map(p => ({ ...p, name: p.title })) ?? [],
    categories: categories ?? [],
    cmsHome: null
  };
}

export default async function Home() {
  const { products, categories, cmsHome } = await getHomePageData();

  if (cmsHome) {
    return (
      <main className="bg-obsidian">
        <CMSRenderer sections={cmsHome.cms_sections || []} />
      </main>
    );
  }

  return (
    <div className="bg-black">
      <Hero />
      <HomeCategoryGrid categories={categories as any} />
      <FeaturedProductsGrid products={products} />
    </div>
  );
}
