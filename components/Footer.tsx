import Link from "next/link";
import { Instagram, MapPin, Phone, Mail, Globe } from "lucide-react";

export async function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 px-6">
            <div className="container-luxury flex flex-col items-center">

                {/* TOP SECTION: BRANDING & CONTACT */}
                <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-16 mb-24 border-b border-white/5 pb-24">

                    {/* COL 1: BOUTIQUE */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">The Boutique</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center md:justify-start gap-4 text-luxury-subtext group cursor-default">
                                <MapPin size={14} className="group-hover:text-gold transition-colors" />
                                <span className="text-[11px] uppercase tracking-widest font-light">Texas, USA</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-luxury-subtext group cursor-default">
                                <Globe size={14} className="group-hover:text-gold transition-colors" />
                                <span className="text-[11px] uppercase tracking-widest font-light">Shipping Worldwide</span>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: CENTERPIECE */}
                    <div className="flex flex-col items-center order-first md:order-none space-y-8">
                        <Link href="/" className="group text-center">
                            <h2 className="font-serif text-3xl md:text-5xl tracking-[0.4em] text-gold uppercase transition-all duration-700 group-hover:tracking-[0.5em] group-hover:text-white">
                                DINACOSMETIC
                            </h2>
                            <p className="text-luxury-subtext text-[10px] uppercase tracking-[0.6em] mt-6 font-light opacity-60">
                                The Obsidian Palace
                            </p>
                        </Link>

                        {/* SOCIALS */}
                        <div className="flex items-center gap-10 pt-4">
                            <Link href="https://www.instagram.com/dinacosmetic_1?igsh=MTB1ZmUyOWg0dDg1Mw==" target="_blank" className="text-luxury-subtext hover:text-gold transition-all duration-500 hover:scale-125">
                                <Instagram size={20} strokeWidth={1.2} />
                            </Link>
                        </div>
                    </div>

                    {/* COL 3: CONCIERGE */}
                    <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-6">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Concierge</h3>
                        <div className="space-y-4">
                            <a href="tel:+12816877609" className="flex items-center justify-center md:justify-end gap-4 text-luxury-subtext hover:text-white transition-colors group">
                                <span className="text-[11px] uppercase tracking-widest font-light">+1 (281) 687-7609</span>
                                <Phone size={14} className="group-hover:text-gold transition-colors" />
                            </a>
                            <a href="mailto:support@dinacosmetic.store" className="flex items-center justify-center md:justify-end gap-4 text-luxury-subtext hover:text-white transition-colors group">
                                <span className="text-[11px] uppercase tracking-widest font-light">support@dinacosmetic.store</span>
                                <Mail size={14} className="group-hover:text-gold transition-colors" />
                            </a>
                        </div>
                    </div>

                </div>

                {/* BOTTOM SECTION: NAVIGATION & LEGAL */}
                <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8">
                    <nav className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                        <Link href="/shop" className="text-[9px] uppercase tracking-widest text-luxury-subtext/40 hover:text-gold transition-colors">Shop</Link>
                        <Link href="/about" className="text-[9px] uppercase tracking-widest text-luxury-subtext/40 hover:text-gold transition-colors">The House</Link>
                        <Link href="/privacy" className="text-[9px] uppercase tracking-widest text-luxury-subtext/40 hover:text-gold transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-[9px] uppercase tracking-widest text-luxury-subtext/40 hover:text-gold transition-colors">Terms</Link>
                    </nav>

                    <p className="text-[9px] uppercase tracking-[0.3em] text-luxury-subtext/20">
                        © {currentYear} DINACOSMETIC. Artfully Crafted in the Palace.
                    </p>
                </div>

            </div>
        </footer>
    );
}
