'use client'
import { motion } from "framer-motion"
import { ShieldCheck, History, Sparkles, Heart } from "lucide-react"

const ITEMS = [
    { icon: History, title: "Legacy", text: "Evolving the timeless secrets of beauty rituals into modern masterpieces." },
    { icon: ShieldCheck, title: "Purity", text: "Untouched by ordinary standards. Crafted only from absolute essentials." },
    { icon: Sparkles, title: "Radiance", text: "Designed to capture and reflect light in its most premium form." },
    { icon: Heart, title: "Devotion", text: "A singular focus on the enhancement of your natural majesty." }
]

export default function PhilosophyGrid() {
    return (
        <section className="py-32 px-6 bg-black flex justify-center border-t border-white/5">
            <div className="max-w-7xl w-full">
                <div className="text-center mb-24 space-y-4">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-gold/60 font-medium">The Obsidian Standard</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">Rituals of Illumination</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {ITEMS.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="bg-obsidian border border-luxury-border p-10 hover:border-gold/30 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <item.icon size={60} strokeWidth={0.5} className="text-gold" />
                            </div>
                            
                            <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center mb-8">
                                <item.icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
                            </div>
                            
                            <h3 className="text-xl font-serif text-white mb-4 tracking-luxury group-hover:text-gold transition-colors">{item.title}</h3>
                            <p className="text-[11px] uppercase tracking-widest text-white/30 leading-[1.8] font-light italic">
                                "{item.text}"
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
