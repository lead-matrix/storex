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
// Media Picker Inline
// ─────────────────────────────────────────────────────────────────────────────
function MediaPickerInline({ onSelect }: { onSelect: (url: string) => void }) {
  const [images, setImages] = useState<{url:string,name:string}[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/admin/media-list')
      .then(r => r.json())
      .then(data => { setImages(data); setLoading(false) })
  }, [])
  if (loading) return <p className='text-center text-gray-400 py-8'>Loading...</p>
  return (
    <div className='grid grid-cols-3 gap-3'>
      {images.map(img => (
        <button key={img.url} type='button' onClick={() => onSelect(img.url)}
          className='aspect-square rounded overflow-hidden border-2 border-transparent
            hover:border-blue-500 transition-all'>
          <img src={img.url} alt={img.name} className='w-full h-full object-cover' />
        </button>
      ))}
    </div>
  )
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
// Prop Editor — auto-generates form fields from block props
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// PropEditor — IMPROVED VERSION with drag-drop uploads + array field editor
// ────────────────────────────────────────────────────────────────────────────
function PropEditor({ block, onChange }: { block: PageBlock; onChange: (updated: PageBlock) => void }) {
    const [dragOverKey, setDragOverKey] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const props = block.props as unknown as Record<string, any>
    const FIELD = 'w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1'

    // Handle file upload (drag or click)
    const handleFileUpload = async (file: File, key: string) => {
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const r = await fetch('/api/admin/media-upload', { method: 'POST', body: fd })
            const data = await r.json()
            if (data.url) {
                set(key, data.url)
                toast.success('Image uploaded')
            } else {
                toast.error('Upload failed')
            }
        } catch (e) {
            toast.error('Upload error: ' + String(e))
        } finally {
            setUploading(false)
        }
    }

    // Array field editor (FAQ items, icon grid items)
    const renderArrayField = (key: string, items: any[], itemSchema: string) => {
        if (itemSchema === 'faq') {
            return (
                <div key={key} className="space-y-2">
                    <label className={LABEL}>{key.replace(/_/g, ' ')}</label>
                    {items.map((item, i) => (
                        <div key={i} className="bg-gray-100 p-3 rounded border border-gray-300 space-y-2">
                            <input type="text" placeholder="Question" value={item.question || ''} onChange={e => { const updated = [...items]; updated[i].question = e.target.value; set(key, updated) }} className={FIELD} />
                            <textarea placeholder="Answer" rows={2} value={item.answer || ''} onChange={e => { const updated = [...items]; updated[i].answer = e.target.value; set(key, updated) }} className={`${FIELD} resize-none`} />
                            <button onClick={() => set(key, items.filter((_, idx) => idx !== i))} className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded text-xs font-bold hover:bg-red-200">
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    ))}
                    <button onClick={() => set(key, [...items, { question: '', answer: '' }])} className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs font-bold hover:bg-blue-200">
                        <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                </div>
            )
        }

        if (itemSchema === 'icon_grid') {
            return (
                <div key={key} className="space-y-2">
                    <label className={LABEL}>{key.replace(/_/g, ' ')}</label>
                    {items.map((item, i) => (
                        <div key={i} className="bg-gray-100 p-3 rounded border border-gray-300 space-y-2">
                            <input type="text" placeholder="Icon (emoji)" value={item.icon || ''} maxLength={2} onChange={e => { const updated = [...items]; updated[i].icon = e.target.value; set(key, updated) }} className={`${FIELD} text-center`} />
                            <input type="text" placeholder="Label" value={item.label || ''} onChange={e => { const updated = [...items]; updated[i].label = e.target.value; set(key, updated) }} className={FIELD} />
                            <input type="text" placeholder="Description" value={item.description || ''} onChange={e => { const updated = [...items]; updated[i].description = e.target.value; set(key, updated) }} className={FIELD} />
                            <button onClick={() => set(key, items.filter((_, idx) => idx !== i))} className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded text-xs font-bold hover:bg-red-200">
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    ))}
                    <button onClick={() => set(key, [...items, { icon: '⭐', label: '', description: '' }])} className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs font-bold hover:bg-blue-200">
                        <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                </div>
            )
        }
    }

    return (
        <div className="space-y-4 p-4">
            {Object.entries(props).map(([key, val]) => {
                if (['id', 'type', 'created_at', 'updated_at'].includes(key)) return null
                const label = key.replace(/_/g, ' ')

                // Array fields
                if (Array.isArray(val)) {
                    if (key === 'items' && val.length > 0 && 'question' in val[0]) return renderArrayField(key, val, 'faq')
                    if (key === 'items' && val.length > 0 && 'icon' in val[0]) return renderArrayField(key, val, 'icon_grid')
                    return null
                }

                // Boolean
                if (typeof val === 'boolean') return (
                    <div key={key} className="flex items-center gap-3">
                        <input type="checkbox" id={key} checked={val} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        <label htmlFor={key} className="text-xs text-gray-700 capitalize cursor-pointer">{label}</label>
                    </div>
                )

                // Number
                if (typeof val === 'number') {
                    if (key.includes('opacity')) return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" value={val} onChange={e => set(key, Number(e.target.value))} className="flex-1" />
                                <span className="text-xs font-bold text-gray-600">{val}%</span>
                            </div>
                        </div>
                    )
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input type="number" value={val} onChange={e => set(key, Number(e.target.value))} className={FIELD} />
                        </div>
                    )
                }

                // Enums
                const ENUMS: Record<string, string[]> = {
                    align: ['left', 'center', 'right'],
                    height: ['sm', 'md', 'lg', 'full'],
                    filter: ['featured', 'bestsellers', 'sale', 'new'],
                    image_side: ['left', 'right'],
                    style: ['line', 'dots', 'ornament'],
                    columns: ['2', '3', '4'],
                    bg_color: ['black', 'gold', 'dark_gray'],
                }
                if (ENUMS[key]) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <select value={String(val)} onChange={e => set(key, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))} className={FIELD}>
                            {ENUMS[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                )

                // DateTime picker
                if (key === 'end_date' && typeof val === 'string') return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input type="datetime-local" value={val.slice(0, 16)} onChange={e => set(key, e.target.value + ':00')} className={FIELD} />
                    </div>
                )

                // Color picker
                if ((key.includes('color') || key.includes('bg')) && typeof val === 'string' && !ENUMS[key]) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input type="color" value={val || '#000000'} onChange={e => set(key, e.target.value)} className="w-full h-10 rounded cursor-pointer border border-gray-200" />
                    </div>
                )

                // Textarea
                if (typeof val === 'string' && (key.includes('body') || key.includes('quote') || key.includes('subheading') || key.includes('description') || key.includes('answer'))) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <textarea value={val} rows={3} onChange={e => set(key, e.target.value)} className={`${FIELD} resize-none`} />
                    </div>
                )

                // Image URL with drag-drop
                if (typeof val === 'string' && key.includes('image')) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <div onDragOver={e => { e.preventDefault(); setDragOverKey(key) }} onDragLeave={() => setDragOverKey(null)} onDrop={e => { e.preventDefault(); setDragOverKey(null); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file, key) }} className={`relative border-2 border-dashed rounded p-4 text-center transition ${dragOverKey === key ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-600 font-medium">Drag image or <button type="button" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = e => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleFileUpload(file, key) }; input.click() }} className="text-blue-600 font-bold hover:underline">browse</button></p>
                            {uploading && <p className="text-[11px] text-blue-600 mt-1">Uploading...</p>}
                        </div>
                        <input type="url" value={val} onChange={e => set(key, e.target.value)} placeholder="Or paste image URL" className={`${FIELD} mt-2 text-xs`} />
                        {val && <div className="mt-2 relative"><img src={val} alt="preview" onError={e => (e.currentTarget.style.display = 'none')} className="h-24 w-full object-cover rounded border border-gray-200" /><button type="button" onClick={() => set(key, '')} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded hover:bg-red-700"><X className="w-3.5 h-3.5" /></button></div>}
                    </div>
                )

                // Default
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
