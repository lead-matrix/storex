'use client'
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactSection() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate premium response
        await new Promise(r => setTimeout(r, 1500));
        toast.success("Message Dispatched to Concierge Service");
        setFormData({ name: '', email: '', message: '' });
        setLoading(false);
    };

    return (
        <section className="py-24 px-6 md:py-32 bg-obsidian border-t border-white/5 selection:bg-gold/40">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start">
                    
                    {/* 🏛️ LEFT: CONCIERGE INFO */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="space-y-16"
                    >
                        <div className="space-y-6">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-gold/80 font-medium">Connect with Us</span>
                            <h2 className="text-4xl md:text-6xl font-serif text-white tracking-tight leading-[1.1]">The Ritual <br /><span className="text-gold/60 italic">Attendant</span></h2>
                        </div>

                        <p className="text-sm md:text-base text-white/40 uppercase tracking-widest leading-[2] italic max-w-lg font-light">
                            Our dedicated team is available to assist you with any inquiries regarding the Palace collection and your acquisitions.
                        </p>

                        <div className="space-y-10 pt-10">
                            <div className="flex items-start gap-8 group">
                                <div className="p-4 bg-white/5 border border-white/10 group-hover:border-gold/30 transition-all rounded-sm">
                                    <Mail className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors" strokeWidth={1} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Registry Inquiries</p>
                                    <p className="text-lg font-serif text-white">support@dinacosmetic.store</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-8 group text-white/90">
                                <div className="p-4 bg-white/5 border border-white/10 group-hover:border-gold/30 transition-all rounded-sm">
                                    <Phone className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors" strokeWidth={1} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Concierge Direct</p>
                                    <p className="text-lg font-serif text-white">+1 (281) 687-7609</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-8 group">
                                <div className="p-4 bg-white/5 border border-white/10 group-hover:border-gold/30 transition-all rounded-sm">
                                    <MapPin className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors" strokeWidth={1} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Palace Locale</p>
                                    <p className="text-lg font-serif text-white">Texas, USA · Shipping Worldwide</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 🎨 RIGHT: ENQUIRY FORM */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="bg-black/60 border border-luxury-border p-8 md:p-12 relative overflow-hidden group shadow-[0_0_100px_rgba(212,175,55,0.03)] selection:bg-gold/20"
                    >
                        {/* Decorative background logo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none scale-150 transform group-hover:scale-110 transition-transform duration-1000">
                             <img src="/logo.jpg" alt="" className="w-96 grayscale invert" />
                        </div>

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-xl font-serif text-white tracking-widest uppercase">Send an Inquiry</h3>
                                <div className="h-px bg-white/5 w-full" />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 group-focus-within:text-gold transition-colors">Identity</label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="Enter your full name"
                                        className="w-full bg-transparent border-b border-white/10 p-2 text-sm text-white focus:border-gold outline-none transition-all placeholder:text-white/10 font-light"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 group-focus-within:text-gold transition-colors">Communication Path</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="Where should we respond?"
                                        className="w-full bg-transparent border-b border-white/10 p-2 text-sm text-white focus:border-gold outline-none transition-all placeholder:text-white/10 font-light"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 group-focus-within:text-gold transition-colors">The Narrative</label>
                                    <textarea 
                                        placeholder="Your detailed inquiry..." 
                                        name="message"
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full bg-transparent border-b border-white/10 p-2 text-sm text-white focus:border-gold outline-none transition-all placeholder:text-white/10 min-h-[120px] font-light italic"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full pt-6 pb-6 border border-gold text-gold text-[10px] uppercase tracking-[0.6em] hover:bg-gold hover:text-black transition-all duration-500 font-bold group flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Dispatch Message <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={1} /></>}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
