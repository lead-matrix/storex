'use client'
// ─────────────────────────────────────────────────────────────────────────────
// BuilderCanvas — full drag-and-drop editor with IMPROVED PropEditor
// Features: drag-drop image upload, color picker, datetime picker, array editing
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    DragEndEvent, DragOverlay, DragStartEvent
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Layers, Loader2, Globe, Eye, Plus, Settings2, Upload } from 'lucide-react'

import { PageBlock, BlockDefinition, BLOCK_CATALOGUE } from '@/lib/builder/types'
import { RenderBlock } from '@/lib/builder/BlockRegistry'
import { savePage } from './actions'
import { toast } from 'sonner'

// ── uuid shim ────────────────────────────────────────────────────────────
function newId() {
    return typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPROVED PropEditor with drag-drop, color, datetime, array editing
// ─────────────────────────────────────────────────────────────────────────────
function PropEditor({ block, onChange }: { block: PageBlock; onChange: (updated: PageBlock) => void }) {
    const [dragActive, setDragActive] = useState(false)

    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const updateArrayItem = (key: string, index: number, itemKey: string, value: unknown) => {
        const arr = (block.props as any)[key] || []
        const updated = [...arr]
        updated[index] = { ...updated[index], [itemKey]: value }
        set(key, updated)
    }

    const addArrayItem = (key: string, template: Record<string, unknown>) => {
        const arr = (block.props as any)[key] || []
        set(key, [...arr, { ...template }])
    }

    const removeArrayItem = (key: string, index: number) => {
        const arr = (block.props as any)[key] || []
        set(key, arr.filter((_: any, i: number) => i !== index))
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = () => {
        setDragActive(false)
    }

    const handleDrop = async (e: React.DragEvent, key: string) => {
        e.preventDefault()
        setDragActive(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            await uploadImage(files[0], key)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadImage(e.target.files[0], key)
        }
    }

    const uploadImage = async (file: File, key: string) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.url) {
                set(key, data.url)
                toast.success('Image uploaded')
            }
        } catch (err) {
            console.error('Upload failed', err)
            toast.error('Upload failed')
        }
    }

    const props = (block.props as any) as Record<string, unknown>
    const FIELD = 'w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1'

    return (
        <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
            {Object.entries(props).map(([key, val]) => {
                const label = key.replace(/_/g, ' ')

                // BOOLEAN
                if (typeof val === 'boolean') {
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <input type="checkbox" id={key} checked={val} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                            <label htmlFor={key} className="text-xs text-gray-700 capitalize cursor-pointer">{label}</label>
                        </div>
                    )
                }

                // NUMBER
                if (typeof val === 'number') {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input type="number" value={val} onChange={e => set(key, Number(e.target.value))} className={FIELD} />
                        </div>
                    )
                }

                // ENUM SELECTS
                const ENUMS: Record<string, string[]> = {
                    align: ['left', 'center', 'right'],
                    height: ['sm', 'md', 'lg', 'full'],
                    filter: ['featured', 'bestsellers', 'sale', 'new'],
                    image_side: ['left', 'right'],
                    style: ['line', 'dots', 'ornament'],
                    columns: ['2', '3', '4'],
                }
                if (ENUMS[key]) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <select value={String(val)} onChange={e => set(key, e.target.value)} className={FIELD}>
                                {ENUMS[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    )
                }

                // COLOR PICKER
                if (typeof val === 'string' && key.includes('color')) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <div className="flex gap-2">
                                <input type="color" value={val} onChange={e => set(key, e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
                                <input type="text" value={val} onChange={e => set(key, e.target.value)} placeholder="#000000" className={`${FIELD} flex-1`} />
                            </div>
                        </div>
                    )
                }

                // DATETIME PICKER
                if (typeof val === 'string' && key.includes('end_date')) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input
                                type="datetime-local"
                                value={val ? new Date(val).toISOString().slice(0, 16) : ''}
                                onChange={e => set(key, new Date(e.target.value).toISOString())}
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // IMAGE FIELD WITH DRAG-DROP
                if (typeof val === 'string' && key.includes('image')) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, key)}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, key)}
                                    className="hidden"
                                    id={`file-${key}`}
                                />
                                <label htmlFor={`file-${key}`} className="cursor-pointer block">
                                    <Upload className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                                    <p className="text-xs text-gray-600">Drag here or click to upload</p>
                                </label>
                            </div>
                            {val && (
                                <div className="mt-2 relative">
                                    <img src={val} alt="preview" className="w-full h-24 object-cover rounded border border-gray-200" />
                                    <button
                                        type="button"
                                        onClick={() => set(key, '')}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }

                // TEXTAREA
                if (typeof val === 'string' && (key.includes('body') || key.includes('quote') || key.includes('subheading') || key.includes('description') || key.includes('answer'))) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <textarea value={val} rows={2} onChange={e => set(key, e.target.value)} className={`${FIELD} resize-none`} />
                        </div>
                    )
                }

                // ARRAY ITEMS (FAQ, Icon Grid)
                if (Array.isArray(val) && key === 'items' && val.length > 0 && typeof val[0] === 'object') {
                    const itemKeys = Object.keys(val[0])
                    return (
                        <div key={key} className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className={LABEL}>{label}</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const template = itemKeys.reduce((acc, k) => ({ ...acc, [k]: '' }), {})
                                        addArrayItem(key, template)
                                    }}
                                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                >
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(val as any[]).map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Item {idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem(key, idx)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {itemKeys.map(itemKey => (
                                                <div key={itemKey}>
                                                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">{itemKey}</label>
                                                    {typeof item[itemKey] === 'string' && (itemKey.includes('answer') || itemKey.includes('description')) ? (
                                                        <textarea
                                                            value={item[itemKey] || ''}
                                                            onChange={e => updateArrayItem(key, idx, itemKey, e.target.value)}
                                                            rows={2}
                                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={item[itemKey] || ''}
                                                            onChange={e => updateArrayItem(key, idx, itemKey, e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                // TEXT INPUT (default)
                return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input type="text" value={String(val)} onChange={e => set(key, e.target.value)} className={FIELD} />
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Block Shell
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
        <div className="flex h-screen bg-gray-900 text-white">
            {/* LEFT SIDEBAR — Block catalogue */}
            <div className={`w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto flex flex-col ${mobileTab !== 'blocks' ? 'max-md:hidden' : ''}`}>
                <h3 className="font-bold mb-4 uppercase text-sm">Add Block</h3>
                <div className="space-y-2 flex-1">
                    {BLOCK_CATALOGUE.map(def => (
                        <button
                            key={def.type}
                            onClick={() => addBlock(def)}
                            className="w-full text-left text-xs bg-gray-700 hover:bg-gray-600 p-3 rounded transition-colors border border-gray-600 hover:border-blue-500"
                        >
                            <div className="font-bold">{def.icon} {def.label}</div>
                            <div className="text-[11px] text-gray-400 mt-1">{def.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CANVAS — Centre content */}
            <div className={`flex-1 bg-gray-950 overflow-y-auto flex flex-col ${mobileTab !== 'canvas' ? 'max-md:hidden' : ''}`}>
                <div className="sticky top-0 z-40 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Page title"
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            value={pageSlug}
                            onChange={e => setPageSlug(e.target.value)}
                            placeholder="slug"
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Publish
                        </button>
                        {published && <span className="text-green-400 text-xs uppercase font-bold">Published</span>}
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex-1 p-6 space-y-4">
                            {blocks.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">No blocks. Add one from the left.</p>
                                </div>
                            ) : (
                                blocks.map(block => (
                                    <SortableBlockShell
                                        key={block.id}
                                        block={block}
                                        isSelected={selected === block.id}
                                        onSelect={() => { setSelected(block.id); setSidebarMode('props') }}
                                        onDelete={() => deleteBlock(block.id)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {draggingBlock && <RenderBlock block={draggingBlock} />}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* RIGHT SIDEBAR — Props editor */}
            {rightOpen && selectedBlock && (
                <div className={`w-72 bg-gray-800 border-l border-gray-700 flex flex-col ${mobileTab !== 'props' ? 'max-md:hidden' : ''}`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                        <h3 className="font-bold text-sm uppercase">Edit Block</h3>
                        <button onClick={() => setRightOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <PropEditor block={selectedBlock} onChange={updateBlock} />
                </div>
            )}
        </div>
    )
}
