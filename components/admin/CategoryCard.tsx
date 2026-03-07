'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit3, Tag, X, Check, Save } from 'lucide-react'
import { deleteCategory, updateCategory } from '@/lib/actions/admin'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { toast } from 'sonner'
import Image from 'next/image'

interface Category {
    id: string
    name: string
    slug: string
    image_url: string | null
}

export function CategoryCard({ category }: { category: Category }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(category.name)
    const [images, setImages] = useState<string[]>(category.image_url ? [category.image_url] : [])
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            if (images.length > 0) {
                formData.append('image_url', images[0])
            } else {
                formData.append('image_url', '')
            }
            await updateCategory(category.id, formData)
            toast.success('Category updated')
            setIsEditing(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update category")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this category?')) return
        try {
            await deleteCategory(category.id)
            toast.success('Category deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete category")
        }
    }

    if (isEditing) {
        return (
            <div className="bg-pearl rounded-luxury shadow-luxury border border-gold/30 p-8 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center border-b border-charcoal/10 pb-4">
                    <h3 className="text-sm font-heading tracking-luxury uppercase font-bold text-charcoal">Edit Taxonomy</h3>
                    <button onClick={() => setIsEditing(false)} className="text-textsoft hover:text-charcoal transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase tracking-luxury text-textsoft font-medium mb-1 block">Category Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-2 text-sm text-charcoal outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-luxury text-textsoft font-medium mb-1 block">Category Highlight Image</label>
                        <div className="bg-white rounded-md p-2 border border-charcoal/10">
                            <ImageUpload
                                images={images}
                                onImagesChange={(imgs) => setImages(imgs.slice(0, 1))} // Only allow 1 image
                                maxImages={1}
                            />
                        </div>
                        <p className="text-[9px] text-textsoft mt-2 uppercase tracking-luxury">Used on Homepage and Collection grids.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-charcoal/10">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 text-[10px] font-medium uppercase tracking-luxury text-charcoal hover:bg-charcoal/5 rounded-full transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-charcoal text-pearl text-[10px] font-medium uppercase tracking-luxury rounded-full hover:bg-gold transition-colors shadow-soft hover:shadow-luxury disabled:opacity-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : <><Save size={14} /> Save</>}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="group relative bg-white rounded-luxury shadow-soft border border-charcoal/10 p-8 hover:shadow-luxury hover:border-gold/30 transition-all duration-500 overflow-hidden flex flex-col h-full">
            <Tag className="absolute -right-4 -bottom-4 w-24 h-24 text-charcoal/[0.02] -rotate-12 group-hover:text-gold/[0.05] transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-heading text-charcoal tracking-luxury">{category.name}</h3>
                    <button onClick={handleDelete} className="text-textsoft hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors z-20">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {category.image_url ? (
                    <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-6 border border-charcoal/10 bg-pearl">
                        <Image src={category.image_url} alt={category.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                ) : (
                    <div className="w-full aspect-[4/3] rounded-md border border-dashed border-charcoal/20 mb-6 bg-pearl/30 flex items-center justify-center text-textsoft/50">
                        <p className="text-[10px] uppercase tracking-luxury">No Cover Image</p>
                    </div>
                )}

                <div className="mt-auto pt-6 border-t border-charcoal/5 flex items-center justify-between">
                    <span className="text-[9px] text-textsoft/60 uppercase tracking-luxury font-medium truncate max-w-[120px]">Slug: {category.slug}</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[9px] text-gold uppercase tracking-luxury font-bold flex items-center gap-2 hover:text-charcoal transition-all z-20"
                    >
                        <Edit3 className="w-3 h-3" />
                        Modify
                    </button>
                </div>
            </div>
        </div>
    )
}
