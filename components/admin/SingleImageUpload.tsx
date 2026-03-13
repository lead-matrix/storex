'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SingleImageUploadProps {
    value: string
    onChange: (url: string) => void
    label?: string
    className?: string
}

export function SingleImageUpload({ value, onChange, label, className = "" }: SingleImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const uploadToSupabase = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `products/variants/${fileName}`

            const { error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, { cacheControl: '3600', upsert: false })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            return publicUrl
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image')
            return null
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)

        try {
            const imageCompression = (await import('browser-image-compression')).default
            const options = {
                maxSizeMB: 0.4,
                maxWidthOrHeight: 2000,
                fileType: 'image/webp',
                initialQuality: 0.85,
                preserveExif: true,
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)

            const url = await uploadToSupabase(compressedFile)
            if (url) {
                onChange(url)
                toast.success('Variant asset deposited')
            }
        } catch (error) {
            console.error('Process error:', error)
        } finally {
            setUploading(false)
        }
    }, [onChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 1,
        disabled: uploading
    })

    return (
        <div className={`relative ${className}`}>
            {value ? (
                <div className="relative w-10 h-10 rounded border border-charcoal/10 overflow-hidden shadow-sm group">
                    <img src={value} alt="Preview" className="object-cover w-full h-full" />
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                    {uploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 size={12} className="animate-spin text-gold" />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`
                        w-10 h-10 rounded border border-dashed flex items-center justify-center bg-pearl cursor-pointer transition-all
                        ${isDragActive ? 'border-gold bg-gold/5 scale-110' : 'border-charcoal/20 hover:border-gold/40'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <Loader2 size={12} className="animate-spin text-gold" />
                    ) : (
                        <Upload size={12} className="text-textsoft" />
                    )}
                </div>
            )}
        </div>
    )
}
