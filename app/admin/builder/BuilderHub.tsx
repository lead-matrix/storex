'use client'
// BuilderHub — shows all created pages and lets admin create new ones.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Globe, FileText, Trash2, Pencil, Loader2, ExternalLink } from 'lucide-react'
import { createNewPage, deletePage } from './actions'

interface PageSummary {
    id: string
    slug: string
    title: string
    published: boolean
    updated_at: string
    blocks: unknown[]
}

export default function BuilderHub({ pages }: { pages: PageSummary[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleCreate = () => {
        startTransition(async () => {
            const { id } = await createNewPage()
            router.push(`/admin/builder?page=${id}`)
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm('Delete this page permanently?')) return
        setDeletingId(id)
        startTransition(async () => {
            await deletePage(id)
            setDeletingId(null)
        })
    }

    return (
        <div className="space-y-8 pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-white tracking-widest uppercase">Page Builder</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold mt-1">Visual Drag-and-Drop Canvas Engine</p>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-gold disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    New Page
                </button>
            </div>

            {/* Pages Grid */}
            {pages.length === 0 ? (
                <div className="bg-obsidian border border-luxury-border rounded-luxury flex flex-col items-center justify-center py-32 gap-6">
                    <FileText className="w-12 h-12 text-white/10" />
                    <p className="text-white/30 text-xs uppercase tracking-widest">No pages created yet</p>
                    <button onClick={handleCreate} disabled={isPending}
                        className="flex items-center gap-2 border border-gold/30 text-gold px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all disabled:opacity-50">
                        <PlusCircle className="w-4 h-4" /> Create Your First Page
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pages.map(page => (
                        <div key={page.id} className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden hover:border-gold/30 transition-all group">
                            {/* Preview thumbnail area */}
                            <div className="h-36 bg-zinc-900 relative flex flex-col items-center justify-center gap-2 border-b border-white/5">
                                <div className="grid grid-cols-3 gap-1 opacity-20 w-20">
                                    {Array.from({ length: (page.blocks as unknown[]).length > 0 ? Math.min((page.blocks as unknown[]).length, 9) : 3 }).map((_, i) => (
                                        <div key={i} className="h-4 bg-white/60 rounded-sm" />
                                    ))}
                                </div>
                                <p className="text-white/20 text-[9px] uppercase tracking-widest">
                                    {(page.blocks as unknown[]).length} block{(page.blocks as unknown[]).length !== 1 ? 's' : ''}
                                </p>
                                {page.published && (
                                    <span className="absolute top-3 right-3 bg-emerald-500 text-black text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                                        ● Live
                                    </span>
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-white font-serif text-base group-hover:text-gold transition-colors truncate">{page.title}</h3>
                                    <p className="text-white/30 text-[10px] font-mono mt-1">/pages/{page.slug}</p>
                                    <p className="text-white/20 text-[9px] uppercase tracking-widest mt-1">
                                        Updated {new Date(page.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/builder?page=${page.id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-gold hover:text-black text-white/70 text-[10px] font-bold uppercase tracking-widest py-2 rounded transition-all"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    {page.published && (
                                        <a href={`/pages/${page.slug}`} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1.5 border border-white/10 hover:border-gold hover:text-gold text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded transition-all">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(page.id)}
                                        disabled={deletingId === page.id}
                                        className="flex items-center gap-1.5 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded transition-all disabled:opacity-40"
                                    >
                                        {deletingId === page.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
