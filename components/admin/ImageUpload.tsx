'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/utils/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
    images: string[]
    onImagesChange: (images: string[]) => void
    maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
    const supabase = createClient()

    const uploadToSupabase = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `products/${fileName}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('Upload error:', error)
                toast.error(`Failed to upload ${file.name}`)
                return null
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            return publicUrl
        } catch (error) {
            console.error('Upload error:', error)
            return null
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (images.length + acceptedFiles.length > maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`)
            return
        }

        setUploading(true)
        const newImages: string[] = []

        for (const file of acceptedFiles) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
                continue
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`)
                continue
            }

            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

            // Simulate progress (Supabase doesn't provide real-time progress)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
                }))
            }, 200)

            const url = await uploadToSupabase(file)

            clearInterval(progressInterval)
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

            if (url) {
                newImages.push(url)
                toast.success(`${file.name} uploaded successfully`)
            }

            // Clear progress after a delay
            setTimeout(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev }
                    delete newProgress[file.name]
                    return newProgress
                })
            }, 1000)
        }

        if (newImages.length > 0) {
            onImagesChange([...images, ...newImages])
        }

        setUploading(false)
    }, [images, maxImages, onImagesChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        },
        maxFiles: maxImages - images.length,
        disabled: uploading || images.length >= maxImages
    })

    const removeImage = async (url: string) => {
        // Extract file path from URL
        const urlParts = url.split('/product-images/')
        if (urlParts.length > 1) {
            const filePath = `products/${urlParts[1].split('?')[0]}`

            // Delete from Supabase Storage
            await supabase.storage
                .from('product-images')
                .remove([filePath])
        }

        onImagesChange(images.filter(img => img !== url))
        toast.success('Image removed')
    }

    return (
        <div className="space-y-4">
            {/* Drag & Drop Zone */}
            {images.length < maxImages && (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-luxury p-8 text-center cursor-pointer transition-all
            ${isDragActive
                            ? 'border-gold bg-gold/5'
                            : 'border-charcoal/20 hover:border-gold/40 bg-white shadow-sm'
                        }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-gold' : 'text-textsoft/40'}`} />
                        <div>
                            <p className="text-sm text-charcoal font-medium mb-1">
                                {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                            </p>
                            <p className="text-[10px] text-textsoft/70 uppercase tracking-luxury">
                                or click to browse • Max {maxImages} images • 5MB each
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-pearl rounded-full text-[10px] uppercase font-medium tracking-luxury mt-2 shadow-sm"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Select Files'
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-pearl border border-charcoal/10 p-3 rounded-md shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-textsoft uppercase tracking-luxury truncate">
                                    {fileName}
                                </span>
                                <span className="text-[10px] text-gold font-mono">{progress}%</span>
                            </div>
                            <div className="h-1 bg-white overflow-hidden rounded-full">
                                <div
                                    className="h-full bg-gold transition-all duration-300 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className="relative group aspect-square bg-pearl border border-charcoal/10 overflow-hidden rounded-luxury shadow-sm"
                        >
                            <Image
                                src={url}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />

                            {/* Primary Image Badge */}
                            {index === 0 && (
                                <div className="absolute top-2 left-2 bg-gold text-white px-2 py-1 text-[8px] uppercase tracking-luxury font-medium rounded-full shadow-sm">
                                    Primary
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                                title="Remove image"
                            >
                                <X size={12} />
                            </button>

                            {/* Image Index */}
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-charcoal px-2 py-1 text-[8px] uppercase tracking-luxury font-medium rounded-full shadow-sm">
                                {index + 1} of {images.length}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {images.length === 0 && (
                <div className="border border-dashed border-charcoal/10 rounded-luxury py-12 flex flex-col items-center justify-center text-textsoft">
                    <ImageIcon size={32} className="mb-3 opacity-20" />
                    <span className="text-[10px] uppercase tracking-luxury font-medium">No images uploaded yet</span>
                </div>
            )}

            {/* Image Count */}
            <div className="flex items-center justify-between text-[10px] uppercase tracking-luxury text-textsoft font-medium">
                <span>
                    {images.length} / {maxImages} images
                </span>
                {images.length > 0 && (
                    <span className="text-gold">
                        <Check size={12} className="inline mr-1" />
                        First image is primary
                    </span>
                )}
            </div>
        </div>
    )
}
