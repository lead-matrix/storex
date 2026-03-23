'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { MediaPicker } from '@/components/admin/MediaPicker'

interface SingleImageUploadProps {
    value: string
    onChange: (url: string) => void
    label?: string
    className?: string
}

export function SingleImageUpload({ value, onChange, label, className = "" }: SingleImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [optimisticPreview, setOptimisticPreview] = useState<string | null>(null)
    const supabase = createClient()

    const uploadToSupabase = async (file: File): Promise<string | null> => {
        try {
            const fileExt = 'webp'
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `products/variants/${fileName}`

            const { error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '31536000',
                    upsert: false,
                    contentType: 'image/webp'
                })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            return publicUrl
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to sync asset')
            return null
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)
        const preview = URL.createObjectURL(file)
        setOptimisticPreview(preview)

        try {
            const imageCompression = (await import('browser-image-compression')).default
            const options = {
                maxSizeMB: 0.1, // Ultra-optimized for 0.0001s
                maxWidthOrHeight: 1200,
                fileType: 'image/webp' as any,
                initialQuality: 0.8,
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)

            const url = await uploadToSupabase(compressedFile)
            if (url) {
                onChange(url)
                toast.success('Asset live in vault')
            }
        } catch (error) {
            console.error('Process error:', error)
        } finally {
            setUploading(false)
            setOptimisticPreview(null)
            URL.revokeObjectURL(preview)
        }
    }, [onChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 1,
        disabled: uploading
    })

    const displayImage = optimisticPreview || value

    return (
        <div className={`relative flex flex-col gap-2 ${className}`}>
            {displayImage ? (
                <div className={`relative w-full h-full min-h-[40px] rounded border border-white/10 overflow-hidden shadow-sm group ${optimisticPreview ? 'opacity-50' : ''}`}>
                    <img src={displayImage} alt="Preview" className="object-cover w-full h-full" />
                    {!uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="p-1 hover:text-red-400 transition-colors"
                                title="Remove"
                            >
                                <X size={16} />
                            </button>
                            <MediaPicker
                                onSelect={onChange}
                                trigger={
                                    <button
                                        type="button"
                                        className="p-1 hover:text-gold transition-colors"
                                        title="Pick from Vault"
                                    >
                                        <ImageIcon size={16} />
                                    </button>
                                }
                            />
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                            <Loader2 size={16} className="animate-spin text-gold" />
                            <span className="text-[8px] uppercase tracking-luxury text-gold font-bold">Syncing</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1 h-full">
                    <div
                        {...getRootProps()}
                        className={`
                            w-full h-full min-h-[40px] flex-grow rounded border border-dashed flex flex-col items-center justify-center bg-white/5 cursor-pointer transition-all gap-2
                            ${isDragActive ? 'border-gold bg-gold/5 scale-[0.98]' : 'border-white/20 hover:border-gold/40'}
                            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        {uploading ? (
                            <Loader2 size={16} className="animate-spin text-gold" />
                        ) : (
                            <>
                                <Upload size={16} className="text-luxury-subtext/40" />
                                {className.includes('h-32') && (
                                    <span className="text-[8px] uppercase tracking-luxury text-luxury-subtext/60">Drop Asset</span>
                                )}
                            </>
                        )}
                    </div>
                    {!uploading && (
                        <MediaPicker
                            onSelect={onChange}
                            trigger={
                                <button
                                    type="button"
                                    className="text-[8px] uppercase tracking-luxury text-luxury-subtext/60 hover:text-gold transition-colors text-center"
                                >
                                    Vault
                                </button>
                            }
                        />
                    )}
                </div>
            )}
        </div>
    )
}

