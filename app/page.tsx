import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/Hero";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, base_price, sale_price, on_sale, is_new, is_bestseller, images, description, is_featured")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  return { products: products ?? [] };
}

export default async function Home() {
  const { products } = await getHomePageData();

  return (
    <div className="bg-black">
      <Hero />
      <FeaturedProductsGrid products={products} />
    </div>
  );
}
