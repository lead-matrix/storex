"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPage } from "@/lib/actions/cms"
import { toast } from "sonner"
import { Layout, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewCMSPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const title = formData.get("title") as string
        const slug = formData.get("slug") as string

        try {
            const page = await createPage(title, slug)
            toast.success("Blueprint created successfully")
            router.push(`/admin/cms/${page.id}`)
        } catch (err: any) {
            toast.error(err.message || "Failed to forge page")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-12 py-12 animate-luxury-fade">
            <Link href="/admin/cms" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-luxury text-white/30 hover:text-gold transition-colors group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Return to Halls
            </Link>

            <div className="space-y-4">
                <h1 className="text-4xl font-serif text-white tracking-tight uppercase">Forge New Space</h1>
                <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Define the identity of your next digital experience.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-obsidian border border-luxury-border p-8 rounded-luxury shadow-luxury">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury font-bold text-white/40">Essence Title</label>
                    <input
                        required
                        name="title"
                        placeholder="e.g. Ritual of the Rose"
                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:border-gold/50 outline-none transition-all font-serif"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury font-bold text-white/40">Path Slug</label>
                    <div className="flex items-center gap-2">
                        <span className="text-white/20 font-mono text-sm">/</span>
                        <input
                            required
                            name="slug"
                            placeholder="ritual-rose"
                            className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-white focus:border-gold/50 outline-none transition-all font-mono text-sm"
                        />
                    </div>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">The unique fragment of the URL that leads to this experience.</p>
                </div>

                <button
                    disabled={loading}
                    className="w-full py-4 bg-gold text-black text-[11px] font-bold uppercase tracking-luxury flex items-center justify-center gap-2 hover:bg-gold-light transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Forging"}
                </button>
            </form>
        </div>
    )
}
