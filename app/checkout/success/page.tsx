import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"

export const metadata = {
    title: "Order Confirmed | The Obsidian Palace",
}

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string }>
}) {
    const { session_id } = await searchParams
    const ref = session_id ? session_id.slice(-8).toUpperCase() : null

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000">
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border border-gold/30 flex items-center justify-center bg-gold/5 relative">
                        <CheckCircle className="text-gold w-12 h-12" />
                        <div className="absolute inset-0 rounded-full border border-gold/20 animate-ping opacity-20" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-serif text-white tracking-tight">Order Confirmed</h1>
                    <p className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] leading-relaxed">
                        Your selection has been curated and is being prepared for transit.
                    </p>
                </div>

                <div className="bg-zinc-950 border border-gold/10 p-6 space-y-3">
                    {ref && (
                        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                            Order Reference: <span className="text-gold font-bold"># {ref}</span>
                        </p>
                    )}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
                        A confirmation has been sent to your email.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-3 bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-gold transition-all duration-500 group"
                >
                    Return to Store
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    )
}
