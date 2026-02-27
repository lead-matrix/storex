import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="bg-black text-white min-h-screen pt-40 pb-20">
            <div className="container-luxury max-w-4xl space-y-16">
                <div className="space-y-6 text-center">
                    <h1 className="text-5xl md:text-7xl font-serif tracking-tight text-white uppercase italic">Privacy</h1>
                    <p className="text-gold uppercase tracking-[0.5em] text-xs font-bold">The Obsidian Protocol</p>
                </div>

                <div className="space-y-12 text-luxury-subtext leading-relaxed font-light text-sm md:text-base">
                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">1. General Governance</h2>
                        <p>
                            DINA COSMETIC (the "House") respects the absolute privacy of its guests. This protocol governs the collection, custody, and protection of data shared during your journey through the Obsidian Palace.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">2. Data Acquisition</h2>
                        <p>
                            We collect only the most essential artifacts of your identity to ensure a flawless delivery experience. This includes your name, delivery coordinates, and communication channels. Financial artifacts are processed through our secure vault partners (Stripe) and are never stored within the Palace.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">3. Use of Information</h2>
                        <p>
                            Your information is utilized solely to:
                        </p>
                        <ul className="list-disc pl-6 space-y-4 text-gold/80 italic">
                            <li>Fulfill orders with architectural precision.</li>
                            <li>Provide concierge support for your cosmetic rituals.</li>
                            <li>Send exclusive invitations to new Obsidian collections.</li>
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-white font-serif text-2xl uppercase tracking-widest italic">4. Security Measures</h2>
                        <p>
                            We employ industrial-grade encryption and rigorous security standards to protect your data from unauthorized intrusion. Our digital infrastructure is monitored continuously for anomalies.
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
