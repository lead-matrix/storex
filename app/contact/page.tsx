import { Mail, MapPin, Phone, Send } from "lucide-react";

export const metadata = {
    title: "Concierge | DINA COSMETIC",
    description: "Contact the Obsidian Palace for inquiries and luxury support.",
};

export default function ContactPage() {
    return (
        <div className="bg-background-primary text-text-bodyDark min-h-screen pt-32 pb-24">
            <div className="px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    {/* Left: Info */}
                    <div className="space-y-16">
                        <div className="space-y-6">
                            <h2 className="text-gold-primary uppercase tracking-[0.5em] text-xs font-light">Client Relations</h2>
                            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter uppercase leading-none text-text-headingDark">
                                Concierge
                            </h1>
                            <p className="text-text-mutedDark text-sm uppercase tracking-[0.3em] max-w-md leading-relaxed">
                                Our dedicated team is available to assist you with any inquiries regarding the Palace collection and your acquisitions.
                            </p>
                        </div>

                        <div className="space-y-12">
                            <ContactItem
                                icon={<Mail size={20} className="text-gold-primary" />}
                                label="Electronic Mail"
                                value="support@dinacosmetic.store"
                            />
                            <ContactItem
                                icon={<Phone size={20} className="text-gold-primary" />}
                                label="Tele-Inquiry"
                                value="+1 (281) 687-7609"
                            />
                            <ContactItem
                                icon={<MapPin size={20} className="text-gold-primary" />}
                                label="Location"
                                value="Texas, USA · Shipping Worldwide"
                            />
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="bg-background-secondary border border-gold-primary/10 p-12 space-y-10 group hover:border-gold-primary/30 transition-all duration-700">
                        <h3 className="text-xl font-serif italic text-text-headingDark">Send an Inquiry</h3>
                        <form className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark font-bold">Your Identity</label>
                                <input
                                    type="text"
                                    placeholder="NAME / TITLE"
                                    className="w-full bg-background-primary border-b border-gold-primary/10 py-4 outline-none focus:border-gold-primary transition-colors text-sm font-light tracking-widest uppercase placeholder:text-text-mutedDark/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark font-bold">Contact Channel</label>
                                <input
                                    type="email"
                                    placeholder="EMAIL ADDRESS"
                                    className="w-full bg-background-primary border-b border-gold-primary/10 py-4 outline-none focus:border-gold-primary transition-colors text-sm font-light tracking-widest uppercase placeholder:text-text-mutedDark/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark font-bold">The Essence of Inquiry</label>
                                <textarea
                                    rows={4}
                                    placeholder="HOW MAY WE ASSIST YOU?"
                                    className="w-full bg-background-primary border-b border-gold-primary/10 py-4 outline-none focus:border-gold-primary transition-colors text-sm font-light tracking-widest uppercase placeholder:text-text-mutedDark/20 resize-none"
                                />
                            </div>
                            <button className="w-full bg-gold-primary text-background-primary py-5 uppercase text-[10px] tracking-[0.4em] font-bold hover:bg-gold-hover transition-all flex items-center justify-center gap-4">
                                Dispatch Message <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex gap-6 items-start">
            <div className="mt-1">{icon}</div>
            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.4em] text-text-mutedDark font-bold">{label}</p>
                <p className="text-lg font-serif italic text-text-headingDark">{value}</p>
            </div>
        </div>
    );
}
