'use client'

import { useState } from 'react'
import { Tag, Trash2, Edit3, Check, X } from 'lucide-react'
import { deleteCategory, updateCategory } from '@/lib/actions/admin'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    slug: string
}

export function CategoryCard({ category }: { category: Category }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(category.name)
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdate = async () => {
        if (!name.trim()) return
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
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
        <div className="group relative bg-white rounded-luxury shadow-soft border border-charcoal/10 p-8 hover:shadow-luxury hover:border-gold/30 transition-all duration-500 overflow-hidden">
            <Tag className="absolute -right-4 -bottom-4 w-24 h-24 text-charcoal/[0.02] -rotate-12 group-hover:text-gold/[0.05] transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    {isEditing ? (
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-pearl border border-gold/30 rounded px-2 py-1 text-lg font-heading text-charcoal outline-none focus:ring-1 focus:ring-gold"
                            autoFocus
                        />
                    ) : (
                        <h3 className="text-lg font-heading text-charcoal tracking-luxury">{category.name}</h3>
                    )}

                    <button
                        onClick={handleDelete}
                        className="text-textsoft hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-[11px] text-textsoft/80 leading-relaxed uppercase tracking-luxury mb-8">
                    Permanent collection identified by unique slug identifier.
                </p>

                <div className="mt-auto pt-6 border-t border-charcoal/5 flex items-center justify-between">
                    <span className="text-[9px] text-textsoft/60 uppercase tracking-luxury font-medium">Slug: {category.slug}</span>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUpdate}
                                disabled={isLoading}
                                className="text-[9px] text-emerald-600 uppercase tracking-luxury font-bold flex items-center gap-1 hover:text-emerald-700 disabled:opacity-50"
                            >
                                <Check className="w-3 h-3" />
                                Save
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setName(category.name); }}
                                className="text-[9px] text-red-400 uppercase tracking-luxury font-bold flex items-center gap-1 hover:text-red-600"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-[9px] text-gold uppercase tracking-luxury font-bold flex items-center gap-2 hover:text-charcoal transition-all"
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
