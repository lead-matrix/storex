import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Palace is Resting | DINA COSMETIC',
    description: 'Our digital boutique is temporarily closed for curation.',
};

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center select-none overflow-hidden relative">
            {/* Aesthetic Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-[#D4AF37] rounded-full blur-[150px]" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-[#D4AF37] rounded-full blur-[150px]" />
            </div>

            <div className="max-w-xl w-full space-y-12 relative z-10">
                {/* Logo Placeholder */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 border-2 border-[#D4AF37] rounded-full flex items-center justify-center p-2 mb-4">
                        <div className="w-full h-full bg-[#D4AF37] rounded-full opacity-80" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl md:text-6xl font-serif text-[#D4AF37] tracking-[0.2em] uppercase leading-tight">
                        The Palace <br />
                        <span className="italic">is</span> Resting
                    </h1>

                    <div className="w-24 h-[1px] bg-[#D4AF37] mx-auto opacity-50" />

                    <p className="text-lg md:text-xl text-neutral-400 font-light tracking-widest leading-relaxed">
                        Our digital boutique is currently undergoing curation to refine your experience.
                        We will return shortly with elevated collections.
                    </p>
                </div>

                <div className="pt-8">
                    <a
                        href="mailto:concierge@dinacosmetic.store"
                        className="inline-block px-10 py-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-700 tracking-[0.3em] text-xs uppercase"
                    >
                        Contact Concierge
                    </a>
                </div>

                <div className="pt-12 text-[10px] text-neutral-600 tracking-[0.5em] uppercase">
                    &copy; {new Date().getFullYear()} DINA COSMETIC &bull; TRÈS LUXE
                </div>
            </div>
        </div>
    );
}
