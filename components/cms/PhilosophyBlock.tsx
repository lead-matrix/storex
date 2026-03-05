import { motion } from "framer-motion"

interface PhilosophyProps {
    content: string
}

export default function PhilosophyBlock({ content }: PhilosophyProps) {
    return (
        <section className="py-32 px-6 flex justify-center bg-obsidian">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5 }}
                className="max-w-2xl w-full"
            >
                <div className="space-y-12">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold text-[10px] font-bold">
                            Φ
                        </div>
                        <span className="text-[10px] uppercase tracking-luxury font-bold text-white/40">Philosophy & Origin</span>
                    </div>

                    <p className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed indent-12 italic">
                        {content}
                    </p>

                    <div className="flex justify-end pt-8">
                        <div className="w-24 h-px bg-white/5" />
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
