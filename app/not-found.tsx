import Link from "next/link";
import { Compass, House } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center text-center px-6 selection:bg-gold/30">
      <div className="space-y-16 animate-in fade-in zoom-in duration-1000 max-w-lg">
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center group">
          <div className="absolute inset-0 border border-gold/10 rounded-full animate-spin-slow group-hover:border-gold/30 transition-colors" />
          <Compass size={40} className="text-gold opacity-40 group-hover:opacity-100 transition-all duration-700" strokeWidth={1} />
        </div>

        <div className="space-y-6">
          <h1 className="text-8xl md:text-[120px] font-serif italic tracking-tighter text-white/5 uppercase leading-none select-none">
            Void
          </h1>
          <p className="text-gold uppercase tracking-[0.8em] text-[10px] font-bold">
            Lost in the Obsidian
          </p>
        </div>

        <p className="text-luxury-subtext text-[11px] uppercase tracking-[0.4em] leading-loose font-light opacity-60">
          The artifact you seek has vanished into history or was never meant to be discovered.
        </p>

        <div className="pt-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-6 text-white uppercase text-[10px] tracking-[0.6em] border border-white/5 px-12 py-5 hover:border-gold hover:text-gold transition-all duration-700 font-bold"
          >
            <House size={14} strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform duration-500" />
            Return to Palace
          </Link>
        </div>
      </div>

      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(184,134,11,0.05)_0%,transparent_70%)]" />
      </div>
    </div>
  );
}