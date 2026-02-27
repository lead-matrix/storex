import Link from "next/link";
import { Instagram } from "lucide-react";

export async function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background border-t border-border pt-20 pb-10 px-6 mt-10">
            <div className="container-luxury flex flex-col items-center">

                <Link href="/" className="group mb-8">
                    <h2 className="font-playfair text-3xl md:text-5xl tracking-widest text-primary uppercase transition-all duration-700 hover:text-textPrimary text-center">
                        DINA COSMETIC
                    </h2>
                </Link>

                <div className="flex items-center gap-8 mb-12">
                    <Link href="/privacy" className="text-xs uppercase tracking-widest text-textSecondary hover:text-primary transition-colors">Privacy</Link>
                    <Link href="/terms" className="text-xs uppercase tracking-widest text-textSecondary hover:text-primary transition-colors">Terms</Link>
                    <Link href="/contact" className="text-xs uppercase tracking-widest text-textSecondary hover:text-primary transition-colors">Contact</Link>
                </div>

                <div className="flex flex-col items-center space-y-6">
                    <Link href="https://www.instagram.com/dinacosmetic_1?igsh=MTB1ZmUyOWg0dDg1Mw==" target="_blank" className="text-textSecondary hover:text-primary transition-colors">
                        <Instagram size={18} strokeWidth={1.5} />
                    </Link>

                    <p className="text-[10px] uppercase tracking-widest text-textSecondary opacity-50">
                        © {currentYear} DINA COSMETIC. All Rights Reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}
