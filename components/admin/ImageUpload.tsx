'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon, Check, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { MediaPicker } from './MediaPicker'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageUploadProps {
    images: string[]
    onImagesChange: (images: string[]) => void
    maxImages?: number
}

interface SortableImageProps {
    url: string
    index: number
    onRemove: (url: string) => void
}

function SortableImage({ url, index, onRemove }: SortableImageProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: url })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group aspect-square bg-[#121214] border border-white/10 overflow-hidden rounded-luxury shadow-soft transition-all"
        >
            <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            />

            {/* Primary Image Badge */}
            {index === 0 && (
                <div className="absolute top-3 left-3 bg-gold text-white px-3 py-1 text-[8px] uppercase tracking-luxury font-bold rounded-full shadow-luxury z-20 pointer-events-none">
                    Primary
                </div>
            )}

            {/* Remove Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove(url)
                }}
                className="absolute top-3 right-3 bg-rose-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md z-30"
                title="Remove image"
            >
                <X size={14} />
            </button>

            {/* Image Index */}
            <div className="absolute bottom-3 left-3 bg-black/90 backdrop-blur-sm text-white px-2 py-1 text-[8px] uppercase tracking-luxury font-bold rounded-full shadow-sm z-20 pointer-events-none">
                {index + 1}
            </div>

            <div className="absolute inset-x-0 bottom-0 py-2 flex justify-center opacity-0 group-hover:opacity-100 bg-black/20 z-10 pointer-events-none transition-opacity">
                <GripVertical size={12} className="text-white" />
            </div>
        </div>
    )
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
    const [optimisticPreviews, setOptimisticPreviews] = useState<string[]>([])
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = images.indexOf(active.id as string)
            const newIndex = images.indexOf(over.id as string)
            onImagesChange(arrayMove(images, oldIndex, newIndex))
        }
    }

    const uploadToSupabase = async (file: File): Promise<string | null> => {
        try {
            const fileExt = 'webp' // browser-image-compression converts to webp based on options
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `products/${fileName}`

            const { error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '31536000', // 1 year for immutable assets
                    upsert: false,
                    contentType: 'image/webp'
                })

            if (error) {
                console.error('Upload error:', error)
                toast.error(`Failed to upload ${file.name}`)
                return null
            }

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
        const previews = acceptedFiles.map(file => URL.createObjectURL(file))
        setOptimisticPreviews(previews)

        const newImages: string[] = []
        const imageCompression = (await import('browser-image-compression')).default

        for (const file of acceptedFiles) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`)
                continue
            }

            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

            const options = {
                maxSizeMB: 0.1, // Highly optimized for 0.0001s load
                maxWidthOrHeight: 1600,
                fileType: 'image/webp' as any,
                initialQuality: 0.8,
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
                    toast.success(`${file.name} optimized & live`)
                }
            } catch (error) {
                console.error('Compression error:', error)
                toast.error(`Failed to process ${file.name}`)
            }

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

        setOptimisticPreviews([])
        setUploading(false)
        previews.forEach(url => URL.revokeObjectURL(url))
    }, [images, maxImages, onImagesChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: maxImages - images.length,
        disabled: uploading || images.length >= maxImages
    })

    const removeImage = async (url: string) => {
        onImagesChange(images.filter(img => img !== url))
        toast.success('Asset removed from vault')
    }

    return (
        <div className="space-y-4">
            {images.length < maxImages && (
                <div className="flex flex-col gap-4">
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-luxury p-12 text-center cursor-pointer transition-all duration-300
                            ${isDragActive
                                ? 'border-gold bg-gold/10 scale-[0.99] shadow-inner font-bold'
                                : 'border-white/20 hover:border-gold/40 bg-[#0B0B0D] shadow-luxury hover:shadow-luxury'
                            }
                            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-gold text-white scale-110' : 'bg-white/5 text-luxury-subtext/40 shadow-inner'}`}>
                                <Upload className={`w-10 h-10 ${isDragActive ? 'animate-bounce' : ''}`} />
                            </div>
                            <div>
                                <p className="text-lg text-white font-heading tracking-luxury mb-1">
                                    {isDragActive ? 'Release to Instant Sync' : 'Deposit Global Assets'}
                                </p>
                                <p className="text-[10px] text-luxury-subtext/70 uppercase tracking-luxury">
                                    drag & drop or click for 0.0001s optimized upload
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <MediaPicker
                            onSelect={() => { }}
                            multiSelect
                            onSelectMultiple={(urls) => {
                                const newImages = urls.filter(url => !images.includes(url))
                                if (images.length + newImages.length > maxImages) {
                                    toast.error(`Maximum ${maxImages} images allowed`)
                                    onImagesChange([...images, ...newImages.slice(0, maxImages - images.length)])
                                } else {
                                    onImagesChange([...images, ...newImages])
                                }
                            }}
                            trigger={
                                <button
                                    type="button"
                                    className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold text-luxury-subtext hover:text-gold hover:border-gold/40 hover:bg-white/5 transition-all shadow-sm"
                                >
                                    <ImageIcon size={14} className="text-gold" />
                                    Import from Vault
                                </button>
                            }
                        />
                    </div>
                </div>
            )}

            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-[#121214] border border-white/10 p-4 rounded-md shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-luxury-subtext uppercase tracking-luxury truncate">{fileName}</span>
                                <span className="text-[10px] text-gold font-mono font-bold">{progress}%</span>
                            </div>
                            <div className="h-1 bg-white/10 overflow-hidden rounded-full">
                                <div className="h-full bg-gold transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={images}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((url, index) => (
                            <SortableImage key={url} url={url} index={index} onRemove={removeImage} />
                        ))}

                        {/* Optimistic Preview Grid */}
                        {optimisticPreviews.map((url, idx) => (
                            <div key={`preview-${idx}`} className="relative aspect-square rounded-luxury overflow-hidden border border-gold/40 opacity-40 animate-pulse">
                                <img src={url} alt="Preview" className="object-cover w-full h-full" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                                </div>
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {images.length === 0 && !uploading && (
                <div className="border border-dashed border-white/10 rounded-luxury py-16 flex flex-col items-center justify-center text-luxury-subtext bg-white/5">
                    <ImageIcon size={48} className="mb-4 opacity-10" />
                    <span className="text-[10px] uppercase tracking-luxury font-medium">Vault Empty</span>
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] uppercase tracking-luxury text-luxury-subtext font-medium pt-2">
                <span>{images.length} / {maxImages} Visual Assets</span>
                <span className="text-gold font-bold">DRAG TO REORDER MASTERPIECES</span>
            </div>
        </div>
    )
}


