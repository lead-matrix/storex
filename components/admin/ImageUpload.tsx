'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon, Check, ArrowLeft, ArrowRight } from 'lucide-react'
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

        // Dynamic import to avoid SSR issues if any, though this is a client component
        const imageCompression = (await import('browser-image-compression')).default

        for (const file of acceptedFiles) {
            // Validate file size (max 10MB before compression)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`)
                continue
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`)
                continue
            }

            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

            // Compression options
            const options = {
                maxSizeMB: 0.4,
                maxWidthOrHeight: 2000,
                fileType: 'image/webp',
                initialQuality: 0.85,
                preserveExif: true,
                useWebWorker: true,
                onProgress: (progress: number) => {
                    setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
                }
            }

            try {
                const compressedFile = await imageCompression(file, options)
                const url = await uploadToSupabase(compressedFile)

                if (url) {
                    newImages.push(url)
                    toast.success(`${file.name} optimized & uploaded`)
                }
            } catch (error) {
                console.error('Compression error:', error)
                toast.error(`Failed to process ${file.name}`)
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

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...images]
        if (direction === 'left' && index > 0) {
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
        } else if (direction === 'right' && index < newImages.length - 1) {
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
        }
        onImagesChange(newImages)
    }

    return (
        <div className="space-y-4">
            {/* Drag & Drop Zone */}
            {images.length < maxImages && (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-luxury p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive
                            ? 'border-gold bg-gold/10 scale-[0.99] shadow-inner font-bold'
                            : 'border-charcoal/20 hover:border-gold/40 bg-white shadow-soft hover:shadow-luxury'
                        }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-gold text-white scale-110' : 'bg-pearl text-textsoft/40 shadow-inner'}`}>
                            <Upload className={`w-10 h-10 ${isDragActive ? 'animate-bounce' : ''}`} />
                        </div>
                        <div>
                            <p className="text-lg text-charcoal font-heading tracking-luxury mb-1">
                                {isDragActive ? 'Release to Upload Masterpiece' : 'Deposit Visual Assets'}
                            </p>
                            <p className="text-[10px] text-textsoft/70 uppercase tracking-luxury">
                                drag & drop or click to browse • Max {maxImages} images • 5MB each
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-pearl rounded-full text-[10px] uppercase font-medium tracking-luxury mt-2 shadow-sm px-10 h-10"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                        <div key={fileName} className="bg-pearl border border-charcoal/10 p-4 rounded-md shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-textsoft uppercase tracking-luxury truncate">
                                    {fileName}
                                </span>
                                <span className="text-[10px] text-gold font-mono font-bold">{progress}%</span>
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className="relative group aspect-square bg-pearl border border-charcoal/10 overflow-hidden rounded-luxury shadow-soft transition-all hover:scale-[1.02]"
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
                                <div className="absolute top-3 left-3 bg-gold text-white px-3 py-1 text-[8px] uppercase tracking-luxury font-bold rounded-full shadow-luxury z-10">
                                    Primary
                                </div>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-3 right-3 bg-rose-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md z-10"
                                title="Remove image"
                            >
                                <X size={14} />
                            </button>

                            {/* Image Index */}
                            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-charcoal px-2 py-1 text-[8px] uppercase tracking-luxury font-bold rounded-full shadow-sm z-10">
                                {index + 1}
                            </div>

                            {/* Reorder Buttons */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {index > 0 ? (
                                    <button onClick={() => moveImage(index, 'left')} className="bg-charcoal/80 text-white p-1.5 rounded hover:bg-gold transition-colors">
                                        <ArrowLeft size={16} />
                                    </button>
                                ) : <div />}
                                {index < images.length - 1 ? (
                                    <button onClick={() => moveImage(index, 'right')} className="bg-charcoal/80 text-white p-1.5 rounded hover:bg-gold transition-colors">
                                        <ArrowRight size={16} />
                                    </button>
                                ) : <div />}
                            </div>

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {images.length === 0 && (
                <div className="border border-dashed border-charcoal/10 rounded-luxury py-16 flex flex-col items-center justify-center text-textsoft bg-pearl/50">
                    <ImageIcon size={48} className="mb-4 opacity-10" />
                    <span className="text-[10px] uppercase tracking-luxury font-medium">No Masterpiece Visuals Uploaded</span>
                </div>
            )}

            {/* Image Count */}
            <div className="flex items-center justify-between text-[10px] uppercase tracking-luxury text-textsoft font-medium pt-2">
                <span>
                    {images.length} / {maxImages} Visual Assets
                </span>
                {images.length > 0 && (
                    <span className="text-gold font-bold">
                        <Check size={14} className="inline mr-1" />
                        Ascending order: First is Primary
                    </span>
                )}
            </div>
        </div>
    )
}

