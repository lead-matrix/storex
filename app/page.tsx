import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 60;

export default function Home() {
  return (
    <div className="bg-[#0a0800] text-white/80">
      <Hero />

      {/* ── Bestsellers Section ── */}
      <section id="shop" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">

          {/* Section header — matching reference */}
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[9px] uppercase tracking-[0.5em] text-amber-500/50 mb-3">Curated Vault</p>
              <h2 className="text-2xl sm:text-3xl font-serif text-white/80 tracking-wide">Bestsellers</h2>
            </div>
            <Link
              href="/shop"
              className="text-[10px] uppercase tracking-[0.3em] text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-2"
            >
              View All
              <span className="text-xs">→</span>
            </Link>
          </div>

          {/* Product grid */}
          <ProductGrid />
        </div>
      </section>

      {/* ── Brand Story ── */}
      <section className="py-28 px-6 border-t border-white/5 bg-gradient-to-b from-[#0a0800] to-[#0d0b00]">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
          <div className="relative w-20 h-20 opacity-70">
            <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif italic text-white/70 leading-relaxed max-w-2xl">
            &ldquo;Beauty is the illumination of your soul. We simply provide the vessel.&rdquo;
          </h2>
          <div className="w-10 h-px bg-amber-500/30" />
          <p className="text-white/25 uppercase tracking-[0.4em] text-[9px]">
            Founded in the Obsidian Palace · 2026
          </p>
        </div>
      </section>
    </div>
  );
}
