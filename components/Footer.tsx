import Link from "next/link";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-black border-t border-gold/10 pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                {/* Brand */}
                <div className="space-y-6">
                    <h2 className="text-xl font-serif tracking-[0.3em] text-white">DINA COSMETIC</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 leading-relaxed">
                        Ultra-minimalist luxury beauty and skincare curated at the Obsidian Palace.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className="text-zinc-500 hover:text-gold transition-colors"><Instagram size={18} /></Link>
                        <Link href="#" className="text-zinc-500 hover:text-gold transition-colors"><Facebook size={18} /></Link>
                        <Link href="#" className="text-zinc-500 hover:text-gold transition-colors"><Twitter size={18} /></Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">The Collection</h3>
                    <nav className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        <Link href="/shop" className="hover:text-white transition-colors">All Products</Link>
                        <Link href="/collections" className="hover:text-white transition-colors">Curated Sets</Link>
                    </nav>
                </div>

                {/* Information */}
                <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">The Palace</h3>
                    <nav className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        <Link href="/about" className="hover:text-white transition-colors">Our Story</Link>
                        <Link href="/shop" className="hover:text-white transition-colors">Boutique</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </nav>
                </div>

                {/* Contact */}
                <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Inquiries</h3>
                    <div className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        <div className="flex items-center gap-3">
                            <MapPin size={14} className="text-gold" />
                            <span>123 Obsidian Tower, Virtual City</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={14} className="text-gold" />
                            <span>concierge@dinacosmetic.store</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={14} className="text-gold" />
                            <span>+1 (800) LUX-DINA</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">
                    © {new Date().getFullYear()} DINA COSMETIC. All rights reserved.
                </p>
                <div className="flex items-center gap-8 grayscale opacity-30">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                </div>
            </div>
        </footer>
    );
}
