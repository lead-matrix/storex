import { MasterpieceHero } from "@/components/MasterpieceHero";
import { BentoFeaturedGrid } from "@/components/BentoFeaturedGrid";
import { CollectionShowcase } from "@/components/CollectionShowcase";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 60;

async function getHomePageData() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, images, description, is_featured, variants(id, name, price_override, stock_quantity)")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(9),
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .order("name")
      .limit(6),
  ]);

  return { products: products ?? [], categories: categories ?? [] };
}

export default async function Home() {
  const { products, categories } = await getHomePageData();

  // Build collection list with fallback
  const fallbackCollections = [
    { id: "obsidian-core", name: "Obsidian Core", slug: null, description: "Essential pieces formulated with absolute black minerals and liquid gold." },
    { id: "royal-crimson", name: "Royal Crimson", slug: null, description: "Hand-crafted lip masterpieces for the inner circle." },
    { id: "palace-gold", name: "Palace Gold", slug: null, description: "Refracted light captured in weighted artisan glass." },
  ];

  const displayCollections = categories.length > 0
    ? categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, image_url: c.image_url }))
    : fallbackCollections;

  return (
    <div className="bg-[#050505] text-white/80 min-h-screen">

      {/* ── Section 1: Hero ── */}
      <MasterpieceHero />

      {/* ── Section 2: Featured Grid (Bento Style) ── */}
      <BentoFeaturedGrid products={products as Parameters<typeof BentoFeaturedGrid>[0]["products"]} />

      {/* ── Section 3: Collection Showcase ── */}
      <CollectionShowcase collections={displayCollections} />

      {/* ── Section 4: Brand Story ── */}
      <section className="py-28 px-6 border-t border-[#D4AF37]/08">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
          <div className="relative w-20 h-20 opacity-60">
            <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain filter-gold-glow" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif italic text-white/65 leading-relaxed max-w-2xl">
            &ldquo;Beauty is the illumination of your soul. We simply provide the vessel.&rdquo;
          </h2>
          <div className="w-10 h-px bg-[#D4AF37]/30" />
          <p className="text-white/20 uppercase tracking-[0.4em] text-[9px]">
            Founded in the Obsidian Palace · 2026
          </p>
          <Link
            href="/about"
            id="brand-story-learn-more"
            className="glass-sm px-8 py-3.5 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all duration-300 min-h-[44px] flex items-center"
          >
            Our Story
          </Link>
        </div>
      </section>
    </div>
  );
}
