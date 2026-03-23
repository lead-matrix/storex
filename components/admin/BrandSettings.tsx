"use client"

import { useState } from "react"
import { SingleImageUpload } from "./SingleImageUpload"
import { Save, Globe, Loader2 } from "lucide-react"
import { updateStoreSettings } from "@/lib/actions/admin"
import { toast } from "sonner"

interface BrandSettingsProps {
    initialData: {
        name: string
        tagline: string
        currency: string
        logo_url?: string
    }
}

export function BrandSettings({ initialData }: BrandSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState(initialData.logo_url || "/logo.jpg")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.append("logo_url", logoUrl)
        
        setLoading(true)
        try {
            const res = await updateStoreSettings(formData)
            if (res.success) {
                toast.success("Empire Branding Synchronized")
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to synchronize")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-[#121214] rounded-luxury shadow-luxury border border-white/5 p-10 space-y-12">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <Globe className="w-4 h-4 text-gold" />
                    <h2 className="text-[10px] uppercase tracking-luxury text-luxury-subtext font-medium">Brand & General Info</h2>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-white/5 text-white border border-white/5 px-6 py-2.5 rounded-full shadow-sm hover:bg-gold text-[10px] uppercase tracking-luxury font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {loading ? "Syncing..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Imperial Sigil (Logo)</label>
                            <div className="bg-white/5 border border-white/5 rounded-md p-6 flex flex-col items-center gap-4">
                                <SingleImageUpload 
                                    value={logoUrl} 
                                    onChange={(url) => setLogoUrl(url)}
                                    className="w-32 h-32"
                                />
                                <p className="text-[8px] uppercase tracking-widest text-textsoft/60">Transparency Optimized (PNG Recommended)</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Domain Name</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={initialData.name}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-md px-6 py-3 text-sm text-white focus:border-gold outline-none transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Empire Slogan</label>
                             <input
                                name="tagline"
                                type="text"
                                defaultValue={initialData.tagline}
                                className="w-full bg-black/50 border border-white/10 rounded-md px-6 py-3 text-sm text-white focus:border-gold outline-none transition-all shadow-inner"
                             />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium">Transaction Currency</label>
                            <select name="currency" defaultValue={initialData.currency}
                                className="w-full bg-black/50 border border-white/10 rounded-md px-6 py-3 text-sm text-white focus:border-gold outline-none transition-all appearance-none cursor-pointer">
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
