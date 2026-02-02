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
          <div className="relative w-24 h-24 opacity-50">
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

      {/* Footer Minimalist */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <h3 className="font-serif text-2xl tracking-widest">DINA COSMETIC</h3>
            <p className="text-white/30 text-xs uppercase tracking-[0.3em] leading-loose max-w-sm">
              The world's most exclusive cosmetic destination.
              Elevating the standard of luxury beauty.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold">Concierge</h4>
            <ul className="text-white/50 text-[10px] uppercase tracking-widest space-y-2">
              <li className="hover:text-gold cursor-pointer transition-colors">Shipping</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Returns</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Contact</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold">Legal</h4>
            <ul className="text-white/50 text-[10px] uppercase tracking-widest space-y-2">
              <li className="hover:text-gold cursor-pointer transition-colors">Terms</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Privacy</li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/20 text-[9px] uppercase tracking-[0.5em]">
          <span>© 2026 DINA COSMETIC | LMT</span>
          <span className="flex items-center gap-4">
            <span>Instagram</span>
            <span>Vogue</span>
            <span>Obsidian</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
