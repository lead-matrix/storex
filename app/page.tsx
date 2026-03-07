import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/Hero";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid";
import CMSRenderer from "@/components/cms/CMSRenderer";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  // 1. Try to fetch CMS driven home page
  try {
    const { data: cmsHome, error: cmsError } = await supabase
      .from("site_pages")
      .select(`*, site_sections(*, content_blocks(*))`)
      .eq("slug", "home")
      .order("position", { foreignTable: "site_sections", ascending: true })
      .maybeSingle();

    if (cmsHome && !cmsError) {
      return { cmsHome, products: [], categories: [] };
    }
  } catch (err) {
    console.warn("CMS Home fetch failed:", err);
  }

  // 2. Fallback to curated legacy layout if no CMS home exists
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, title, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, status")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .limit(4);

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .limit(6);

  if (prodErr) console.error("Error fetching products:", prodErr);
  if (catErr) console.error("Error fetching categories:", catErr);

  return {
    products: products?.map(p => ({ ...p, name: p.title })) ?? [],
    categories: categories ?? [],
    cmsHome: null
  };
}

function transformCMSSessions(siteSections: any[]) {
  return siteSections.map((section) => {
    const props: Record<string, any> = {};
    if (section.content_blocks) {
      section.content_blocks.forEach((block: any) => {
        // Assume value is what we want, or key-value pair
        props[block.key] = block.value;
      });
    }
    return {
      type: section.type,
      props,
    };
  });
}

export default async function Home() {
  const { products, categories, cmsHome } = await getHomePageData();

  if (cmsHome) {
    const sections = transformCMSSessions(cmsHome.site_sections || []);
    return (
      <main className="bg-obsidian">
        <CMSRenderer sections={sections} />
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
