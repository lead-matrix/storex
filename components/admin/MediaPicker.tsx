'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageIcon, Search, Loader2, Check, X } from 'lucide-react'
import Image from 'next/image'

interface MediaFile {
    id: string
    name: string
    url: string
    path: string
}

interface MediaPickerProps {
    onSelect: (url: string) => void
    trigger?: React.ReactNode
    multiSelect?: boolean
    onSelectMultiple?: (urls: string[]) => void
}

export function MediaPicker({ onSelect, trigger, multiSelect = false, onSelectMultiple }: MediaPickerProps) {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchFiles()
        }
    }, [open])

    async function fetchFiles() {
        setLoading(true)
        try {
            // Fetch from roots and 'products' folder
            const [rootRes, prodRes] = await Promise.all([
                supabase.storage.from('product-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }),
                supabase.storage.from('product-images').list('products', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
            ])

            const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`

            const rootFiles = (rootRes.data ?? [])
                .filter(f => f.metadata && f.name !== '.emptyFolderPlaceholder')
                .map(f => ({
                    id: f.id,
                    name: f.name,
                    path: f.name,
                    url: `${bucketUrl}/${f.name}`
                }))

            const prodFiles = (prodRes.data ?? [])
                .filter(f => f.metadata && f.name !== '.emptyFolderPlaceholder')
                .map(f => ({
                    id: f.id,
                    name: f.name,
                    path: `products/${f.name}`,
                    url: `${bucketUrl}/products/${f.name}`
                }))

            setFiles([...prodFiles, ...rootFiles])
        } catch (err) {
            console.error('Failed to fetch media:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const handleSelect = (file: MediaFile) => {
        if (multiSelect) {
            const next = new Set(selected)
            if (next.has(file.url)) next.delete(file.url)
            else next.add(file.url)
            setSelected(next)
        } else {
            onSelect(file.url)
            setOpen(false)
        }
    }

    const confirmSelection = () => {
        if (onSelectMultiple) {
            onSelectMultiple(Array.from(selected))
        }
        setOpen(false)
        setSelected(new Set())
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Media Library
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-luxury-border bg-white rounded-luxury shadow-luxury">
                <DialogHeader className="p-6 border-b border-charcoal/5 bg-pearl/30">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-heading tracking-luxury text-charcoal flex items-center gap-3">
                            <ImageIcon className="w-5 h-5 text-gold" />
                            VAULT SELECTION
                        </DialogTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textsoft/40" />
                            <input
                                placeholder="Search the vault..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-charcoal/10 rounded-full text-xs outline-none focus:border-gold/50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto p-6 scrollbar-thin">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-gold" />
                            <p className="text-[10px] uppercase tracking-widest text-textsoft font-bold animate-pulse">Consulting the Archives...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-textsoft/40">
                            <X className="w-12 h-12 mb-4 opacity-10" />
                            <p className="text-[10px] uppercase tracking-widest font-bold">The archives are empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => handleSelect(file)}
                                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all group shadow-sm
                                        ${selected.has(file.url) ? 'border-gold ring-2 ring-gold/20' : 'border-pearl hover:border-gold/40'}`}
                                >
                                    <Image
                                        src={file.url}
                                        alt={file.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-110"
                                        sizes="(max-width: 768px) 33vw, 20vw"
                                        unoptimized
                                    />
                                    {selected.has(file.url) && (
                                        <div className="absolute inset-0 bg-gold/10 flex items-center justify-center">
                                            <div className="bg-gold text-white p-1 rounded-full shadow-luxury">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[8px] text-white truncate text-center uppercase tracking-widest">{file.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-charcoal/5 bg-pearl/30 flex justify-between items-center px-6">
                    <p className="text-[10px] uppercase tracking-widest text-textsoft font-medium">
                        {selected.size} Artifacts Prepared
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[10px] uppercase tracking-widest font-bold">
                            Cancel
                        </Button>
                        {multiSelect && (
                            <Button
                                onClick={confirmSelection}
                                disabled={selected.size === 0}
                                className="bg-charcoal text-white hover:bg-gold px-6 text-[10px] uppercase tracking-widest font-bold shadow-soft transition-all"
                            >
                                Integrate Assets
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
