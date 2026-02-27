import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury max-w-4xl space-y-16">
                <div className="space-y-6 text-center">
                    <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white uppercase italic">Terms</h1>
                    <p className="text-gold uppercase tracking-[0.5em] text-xs font-bold">Conditions of Engagement</p>
                </div>

                <div className="space-y-12 text-luxury-subtext leading-relaxed font-light text-sm md:text-base">
                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">1. Acceptance of Terms</h2>
                        <p>
                            By entering the DINA COSMETIC digital boutique, you agree to abide by the high standards and protocols established for our community.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">2. Product Integrity</h2>
                        <p>
                            All formulations and tools are artfully crafted. While we strive for photographic accuracy, the obsidian-matte finishes and golden hues may vary slightly due to the screen calibration of your device.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">3. Transactional Conduct</h2>
                        <p>
                            Purchases are final once processed. In the event of an arrival defect, contact our Concierge within 48 hours for immediate resolution. Shipping rituals are performed within [X] days of validation.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">4. Intellectual Custody</h2>
                        <p>
                            All artistic assets, including the "Obsidian Palace" identity, are the exclusive property of DINA COSMETIC. Unauthorized reproduction is strictly prohibited.
                        </p>
                    </section>

                    <div className="pt-12 border-t border-white/5 flex justify-center">
                        <Link href="/" className="text-gold uppercase tracking-[0.4em] text-[10px] font-bold border border-gold/20 px-10 py-4 hover:bg-gold hover:text-black transition-all">
                            Back to Palace
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
