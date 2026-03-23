'use client'

import { useState } from 'react'
import { Tag, Trash2, Edit3, Check, X } from 'lucide-react'
import { deleteCategory, updateCategory } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { SingleImageUpload } from './SingleImageUpload'

interface Category {
    id: string
    name: string
    slug: string
    image_url?: string
}

export function CategoryCard({ category }: { category: Category }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(category.name)
    const [imageUrl, setImageUrl] = useState(category.image_url || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdate = async () => {
        if (!name.trim()) return
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            if (imageUrl) formData.append('image_url', imageUrl)
            await updateCategory(category.id, formData)
            setIsEditing(false)
            toast.success("Category updated")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return
        try {
            await deleteCategory(category.id)
            toast.success("Category deleted")
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <div className={`group relative bg-[#121214] rounded-luxury shadow-luxury border border-white/5 p-8 transition-all duration-500 overflow-hidden flex flex-col ${isEditing ? 'h-auto min-h-[380px]' : 'h-[280px] hover:border-gold/30'}`}>
            {/* Background Image / Placeholder */}
            {!isEditing && category.image_url && (
                <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-40 mix-blend-luminosity group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-700">
                    <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent" />
                </div>
            )}
            
            {!isEditing && !category.image_url && (
                 <Tag className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.02] -rotate-12 group-hover:text-gold/[0.05] transition-all duration-700 pointer-events-none z-0" />
            )}

            <div className="relative z-10 flex flex-col h-full pointer-events-auto">
                <div className="flex w-full justify-between items-start mb-4">
                    {isEditing ? (
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black/50 border border-gold/30 rounded px-3 py-2 w-full text-lg font-heading text-white outline-none focus:ring-1 focus:ring-gold"
                            autoFocus
                        />
                    ) : (
                        <h3 className="text-xl font-heading text-white tracking-luxury line-clamp-1 truncate pr-2">{category.name}</h3>
                    )}

                    {!isEditing && (
                         <button
                            onClick={handleDelete}
                            className="text-luxury-subtext hover:text-red-500 hover:bg-black/20 p-1.5 rounded-full transition-colors z-20 flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex-1 w-full my-4 relative z-50 pointer-events-auto">
                         <label className="text-[9px] uppercase tracking-luxury text-luxury-subtext font-medium block mb-3">Category Cover Image</label>
                         <SingleImageUpload 
                             value={imageUrl} 
                             onChange={setImageUrl}
                             className="h-[140px] w-full"
                         />
                    </div>
                ) : (
                     <p className="text-[10px] text-luxury-subtext/80 leading-relaxed uppercase tracking-luxury mt-auto mb-6">
                        {category.image_url ? 'Cover asset configured.' : 'No cover asset.'}
                     </p>
                )}

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between z-20">
                    <span className="text-[9px] text-luxury-subtext/60 uppercase tracking-luxury font-medium truncate max-w-[120px]">Slug: {category.slug}</span>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUpdate}
                                disabled={isLoading}
                                className="text-[9px] text-emerald-500 uppercase tracking-luxury font-bold flex items-center gap-1 hover:text-emerald-400 disabled:opacity-50 px-2 py-1 bg-emerald-500/10 rounded"
                            >
                                <Check className="w-3 h-3" />
                                Save
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setName(category.name); setImageUrl(category.image_url || ''); }}
                                className="text-[9px] text-red-400 uppercase tracking-luxury font-bold flex items-center gap-1 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-[9px] text-gold uppercase tracking-luxury font-bold flex items-center gap-2 hover:text-white transition-all bg-white/5 px-3 py-1.5 rounded-full"
                        >
                            <Edit3 className="w-3 h-3" />
                            Modify
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
