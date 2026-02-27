import Link from "next/link";
import { Instagram } from "lucide-react";

export async function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black border-t border-white/10 pt-20 pb-10 px-6 mt-10">
            <div className="container-luxury flex flex-col items-center">

                <Link href="/" className="group mb-8">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-[0.4em] text-[#C6A75E] uppercase transition-all duration-700 group-hover:tracking-[0.5em] group-hover:text-white text-center">
                        DINACOSMETIC
                    </h2>
                </Link>

                <div className="flex items-center gap-8 mb-12">
                    <Link href="/privacy" className="text-[10px] uppercase tracking-widest text-[#b3b3b3] hover:text-[#C6A75E] transition-colors">Privacy</Link>
                    <Link href="/terms" className="text-[10px] uppercase tracking-widest text-[#b3b3b3] hover:text-[#C6A75E] transition-colors">Terms</Link>
                    <Link href="/contact" className="text-[10px] uppercase tracking-widest text-[#b3b3b3] hover:text-[#C6A75E] transition-colors">Contact</Link>
                </div>

                <div className="flex flex-col items-center space-y-6">
                    <Link href="https://www.instagram.com/dinacosmetic_1?igsh=MTB1ZmUyOWg0dDg1Mw==" target="_blank" className="text-[#b3b3b3] hover:text-[#C6A75E] transition-colors">
                        <Instagram size={18} strokeWidth={1.5} />
                    </Link>

                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#b3b3b3]/40">
                        © {currentYear} DINACOSMETIC. All Rights Reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}
