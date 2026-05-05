'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BuilderCanvas — full drag-and-drop editor with inline property panel.
// Uses @dnd-kit/core + @dnd-kit/sortable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    DragEndEvent, DragOverlay, DragStartEvent
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Layers, Loader2, Globe, Eye, Plus, Settings2 } from 'lucide-react'

import { PageBlock, BlockDefinition, BLOCK_CATALOGUE } from '@/lib/builder/types'
import { PropEditor } from './PropEditor-improved'
import { RenderBlock } from '@/lib/builder/BlockRegistry'
import { savePage } from './actions'
import { toast } from 'sonner'

// ── uuid shim (next.js edge-compatible) ────────────────────────────────────-
function newId() {
    return typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Block Shell (wrapper around each block in the canvas)
// ─────────────────────────────────────────────────────────────────────────────
function SortableBlockShell({
    block, isSelected, onSelect, onDelete
}: {
    block: PageBlock
    isSelected: boolean
    onSelect: () => void
    onDelete: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
    const def = BLOCK_CATALOGUE.find(d => d.type === block.type)

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
            className={`group relative border-2 transition-all duration-150 cursor-default
                ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-white/20'}`}
            onClick={onSelect}
        >
            {/* Drag handle + label + delete — shown on hover/selection */}
            <div className={`absolute top-2 left-2 z-50 flex items-center gap-1.5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    {...attributes} {...listeners}
                    className="bg-blue-600 text-white p-1.5 rounded cursor-grab active:cursor-grabbing shadow-lg"
                    onClick={e => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </button>
                <span className="bg-blue-600 text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded">
                    {def?.icon} {def?.label}
                </span>
            </div>
            <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className={`absolute top-2 right-2 z-50 bg-red-600 text-white p-1.5 rounded shadow-lg transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Block preview */}
            <div className="pointer-events-none select-none">
                <RenderBlock block={block} />
            </div>
        </div>
    )
}



// ─────────────────────────────────────────────────────────────────────────────
// Main BuilderCanvas
// ─────────────────────────────────────────────────────────────────────────────
interface BuilderCanvasProps {
    pageId: string
    slug: string
    title: string
    initialBlocks: PageBlock[]
    published: boolean
}

export default function BuilderCanvas({ pageId, slug, title: initialTitle, initialBlocks, published: initPublished }: BuilderCanvasProps) {
    const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks)
    const [selected, setSelected] = useState<string | null>(null)
    const [title, setTitle] = useState(initialTitle)
    const [pageSlug, setPageSlug] = useState(slug)
    const [published, setPublished] = useState(initPublished)
    const [sidebarMode, setSidebarMode] = useState<'blocks' | 'props'>('blocks')
    const [saving, setSaving] = useState(false)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [rightOpen, setRightOpen] = useState(true)
    const [mobileTab, setMobileTab] = useState<'blocks'|'canvas'|'props'>('canvas')

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    const selectedBlock = blocks.find(b => b.id === selected) ?? null

    const addBlock = useCallback((def: BlockDefinition) => {
        const newBlock: PageBlock = { id: newId(), type: def.type, props: { ...def.defaultProps } }
        setBlocks(prev => [...prev, newBlock])
        setSelected(newBlock.id)
        setSidebarMode('props')
        if (window.innerWidth < 768) setMobileTab('canvas')
    }, [])

    const updateBlock = useCallback((updated: PageBlock) => {
        setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
    }, [])

    const deleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id))
        setSelected(null)
        setSidebarMode('blocks')
    }, [])

    const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id))
    const handleDragEnd = (e: DragEndEvent) => {
        setDraggingId(null)
        const { active, over } = e
        if (over && active.id !== over.id) {
            setBlocks(prev => {
                const oldIdx = prev.findIndex(b => b.id === active.id)
                const newIdx = prev.findIndex(b => b.id === over.id)
                return arrayMove(prev, oldIdx, newIdx)
            })
        }
    }

    const handleSave = async (pub: boolean) => {
        setSaving(true)
        const result = await savePage({ id: pageId, slug: pageSlug, title, blocks, published: pub })
        setSaving(false)
        if (result.success) {
            setPublished(pub)
            toast.success(pub ? `Published at /pages/${pageSlug}` : 'Draft saved.')
        } else {
            toast.error(result.error ?? 'Save failed.')
        }
    }

    const draggingBlock = draggingId ? blocks.find(b => b.id === draggingId) : null

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-100" id="builder-root">
            <div className='flex md:hidden border-b border-gray-200 bg-white sticky top-0 z-30 flex-shrink-0'>
                {(['blocks','canvas','props'] as const).map(tab => (
                    <button key={tab} type='button'
                        onClick={() => { 
                            setMobileTab(tab); 
                            if(tab==='props' && !selected) setMobileTab('canvas');
                            else if(tab==='blocks') setSidebarMode('blocks');
                            else if(tab==='props') setSidebarMode('props');
                        }}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                            mobileTab===tab
                                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}>
                        {tab==='blocks' ? '⊞ Blocks' : tab==='canvas' ? '⬜ Preview' : '⚙ Settings'}
                    </button>
                ))}
            </div>
            {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
            <aside className={`w-full md:w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0 z-20 overflow-y-auto ${mobileTab === 'blocks' || mobileTab === 'props' ? 'flex' : 'hidden md:flex'}`}>
                <div className="px-4 py-4 border-b border-gray-200">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-1">Page Title</p>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b border-gray-200 pb-1 outline-none focus:border-blue-500 transition-colors"
                    />
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mt-3 mb-1">URL Slug</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span className="text-gray-400">/pages/</span>
                        <input
                            value={pageSlug}
                            onChange={e => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                            className="flex-1 bg-transparent border-b border-gray-200 pb-1 outline-none focus:border-blue-500 text-gray-900 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex border-b border-gray-200">
                    <button onClick={() => setSidebarMode('blocks')} className={`flex-1 py-2.5 text-[10px] uppercase font-bold tracking-wide flex items-center justify-center gap-1.5 transition-colors ${sidebarMode === 'blocks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Plus className="w-3 h-3" /> Blocks
                    </button>
                    <button onClick={() => setSidebarMode('props')} disabled={!selectedBlock} className={`flex-1 py-2.5 text-[10px] uppercase font-bold tracking-wide flex items-center justify-center gap-1.5 transition-colors ${sidebarMode === 'props' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600 disabled:opacity-30'}`}>
                        <Settings2 className="w-3 h-3" /> Props
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sidebarMode === 'blocks' ? (
                        <div className="p-3 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold px-1 pt-2 pb-1">Drag or click to add</p>
                            {BLOCK_CATALOGUE.map(def => (
                                <button
                                    key={def.type}
                                    onClick={() => addBlock(def)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group flex items-start gap-3"
                                >
                                    <span className="text-xl flex-shrink-0 mt-0.5">{def.icon}</span>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">{def.label}</p>
                                        <p className="text-[10px] text-gray-400 leading-snug">{def.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : selectedBlock ? (
                        <PropEditor block={selectedBlock} onChange={updated => { updateBlock(updated); }} />
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-xs mt-8">
                            <Settings2 className="w-6 h-6 mx-auto mb-3 opacity-30" />
                            Select a block on the canvas to edit its properties.
                        </div>
                    )}
                </div>

                {/* Page structure mini-map */}
                <div className="border-t border-gray-200 px-3 py-3">
                    <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Structure ({blocks.length})</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                        {blocks.map((b, i) => {
                            const def = BLOCK_CATALOGUE.find(d => d.type === b.type)
                            return (
                                <button
                                    key={b.id}
                                    onClick={() => { setSelected(b.id); setSidebarMode('props') }}
                                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors ${selected === b.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span className="text-xs flex-shrink-0">{def?.icon}</span>
                                    <span className="truncate">{i + 1}. {def?.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* ── MAIN CANVAS ─────────────────────────────────────────────── */}
            <main className={`flex-1 flex flex-col overflow-hidden ${mobileTab === 'canvas' ? 'flex' : 'hidden md:flex'}`}>
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-1">
                        <span className="font-medium text-gray-900">{title || 'Untitled Page'}</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-mono text-xs text-gray-400">/pages/{pageSlug}</span>
                        {published
                            ? <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">● Live</span>
                            : <span className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Draft</span>
                        }
                    </div>
                    {published && (
                        <a href={`/pages/${pageSlug}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </a>
                    )}
                    <button onClick={() => handleSave(false)} disabled={saving}
                        className="px-4 py-2 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
                        Save Draft
                    </button>
                    <button onClick={() => handleSave(true)} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 shadow">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                        Publish
                    </button>
                </div>

                {/* Canvas */}
                <div
                    className="flex-1 overflow-y-auto bg-gray-200"
                    onClick={() => { setSelected(null); setSidebarMode('blocks') }}
                >
                    {/* Simulated browser frame */}
                    <div className="max-w-5xl mx-auto my-6 shadow-2xl rounded-lg overflow-hidden">
                        <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="flex-1 mx-3 bg-gray-700 rounded text-[10px] text-gray-400 px-3 py-1 text-center">
                                dinacosmetic.store/pages/{pageSlug}
                            </div>
                        </div>

                        <div className="min-h-[600px] bg-black" onClick={e => e.stopPropagation()}>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {blocks.length === 0 ? (
                                        <div className="h-[600px] flex flex-col items-center justify-center gap-4 text-white/20">
                                            <Layers className="w-12 h-12" />
                                            <p className="text-sm uppercase tracking-widest">Canvas is empty</p>
                                            <p className="text-xs">Click a block in the left panel to add it here</p>
                                        </div>
                                    ) : (
                                        blocks.map(block => (
                                            <SortableBlockShell
                                                key={block.id}
                                                block={block}
                                                isSelected={selected === block.id}
                                                onSelect={() => { 
                                                    setSelected(block.id); 
                                                    setSidebarMode('props');
                                                    if (window.innerWidth < 768) setMobileTab('props');
                                                }}
                                                onDelete={() => deleteBlock(block.id)}
                                            />
                                        ))
                                    )}
                                </SortableContext>
                                <DragOverlay>
                                    {draggingBlock ? (
                                        <div className="opacity-90 shadow-2xl pointer-events-none scale-95 transition-transform">
                                            <RenderBlock block={draggingBlock} />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
