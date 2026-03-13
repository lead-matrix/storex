'use client'

import { useState, useRef } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function BulkImportButton() {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file")
            return
        }

        setIsUploading(true)
        const toastId = toast.loading("Processing bulk asset ingestion...")

        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/admin/products/import", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()

            if (res.ok) {
                toast.success(`Successfully processed ${result.processed} artifacts`, { id: toastId })
                router.refresh()
            } else {
                toast.error(result.error || "Failed to import assets", { id: toastId })
            }
        } catch (error) {
            console.error("Import error:", error)
            toast.error("A critical system error occurred during ingestion", { id: toastId })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                disabled={isUploading}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded text-[11px] font-bold uppercase tracking-luxury text-white/50 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Ingesting...' : 'Import CSV'}
            </button>
        </div>
    )
}
