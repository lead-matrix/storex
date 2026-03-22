import Link from "next/link"
import { XCircle, ArrowLeft } from "lucide-react"

export const metadata = {
    title: "Order Cancelled | The Obsidian Palace",
}

export default function CancelPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000">
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border border-red-900/40 flex items-center justify-center bg-red-950/10 relative">
                        <XCircle className="text-red-500/80 w-12 h-12" />
                        <div className="absolute inset-0 rounded-full border border-red-900/20 animate-ping opacity-10" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-serif text-white tracking-tight">Order Cancelled</h1>
                    <p className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] leading-relaxed">
                        Your cart is safe — nothing was charged.
                    </p>
                </div>

                <div className="bg-zinc-950 border border-gold/10 p-6 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
                        You may return to checkout at any time. Your selection remains intact.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/checkout"
                        className="inline-flex items-center gap-3 border border-gold/30 text-gold px-10 py-4 text-[10px] font-bold uppercase tracking-[0.35em] hover:bg-gold/10 transition-all duration-500 group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-[10px] font-bold uppercase tracking-[0.35em] hover:bg-gold transition-all duration-500"
                    >
                        Return to Store
                    </Link>
                </div>
            </div>
        </div>
    )
}
