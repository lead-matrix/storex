import { Star } from "lucide-react";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Eleanor V.",
        role: "Verified Buyer",
        content: "DINA COSMETIC has completely transformed my beauty routine. The pure black aesthetic is stunning, but the quality of these products is entirely unmatched. Truly professional grade.",
    },
    {
        id: 2,
        name: "Sophia C.",
        role: "Professional MUA",
        content: "As a makeup artist, I demand the highest standard. The Obsidian Collection blends flawlessly, wears beautifully all day, and looks unbelievably luxurious on my vanity.",
    },
    {
        id: 3,
        name: "Amira K.",
        role: "Verified Buyer",
        content: "I've finally found my signature look. The liquid lipsticks are breathtaking, weightless, and last from morning coffee until late evening. The gold detailing is just the perfect touch.",
    }
];

export function TestimonialSection() {
    return (
        <section className="bg-background border-t border-charcoal/10 py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-playfair text-primary tracking-[0.1em] uppercase">
                        The Standard of Excellence
                    </h2>
                    <p className="text-textSecondary tracking-widest font-light text-sm">
                        REVIEWS FROM THE OBSIDIAN PALACE
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((testimonial) => (
                        <div key={testimonial.id} className="glass gold-glow-hover p-8 rounded-luxury relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                ))}
                            </div>

                            <p className="text-textPrimary font-light leading-relaxed mb-8 italic tracking-wide">
                                "{testimonial.content}"
                            </p>

                            <div className="border-t border-white/5 pt-4 flex flex-col">
                                <span className="font-playfair text-primary tracking-widest uppercase text-sm mb-1">
                                    {testimonial.name}
                                </span>
                                <span className="text-textSecondary text-[10px] uppercase tracking-widest">
                                    {testimonial.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
