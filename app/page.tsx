import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/Hero";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { HomeCategoryGrid } from "@/features/home/components/HomeCategoryGrid";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  // Fetch featured products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, is_featured")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch active categories with images
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .order("name", { ascending: true });

  return {
    products: products ?? [],
    categories: categories ?? []
  };
}

export default async function Home() {
  const { products, categories } = await getHomePageData();

  return (
    <div className="bg-black">
      <Hero />
      <HomeCategoryGrid categories={categories} />
      <FeaturedProductsGrid products={products} />
    </div>
  );
}
