import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="bg-black text-white">
      <Hero />
      <ProductGrid />

      {/* Brand Story Section */}
      <section className="py-32 px-6 border-t border-white/5 bg-gradient-to-b from-black to-[#050505]">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">
          <div className="relative w-32 h-32 md:w-48 md:h-48 opacity-80 transition-opacity duration-1000 hover:opacity-100">
            <Image src="/logo.jpg" alt="Logo" fill className="object-contain" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif italic tracking-tight max-w-2xl leading-tight">
            "Beauty is the illumination of your soul. We simply provides the vessel."
          </h2>
          <div className="w-12 h-px bg-gold/30" />
          <p className="text-white/40 uppercase tracking-[0.4em] text-[10px] font-light">
            Founded in the Obsidian Palace, 2026.
          </p>
        </div>
      </section>

      {/* Note: The global Footer is managed by layout.tsx. 
          The local footer from previously was removed to prevent duplication. */}
    </div>
  );
}
