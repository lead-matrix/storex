// ─────────────────────────────────────────────────────────────────────────────
// PropEditor — IMPROVED VERSION
// Replaces the current PropEditor in BuilderCanvas.tsx
// 
// Key improvements:
// 1. Inline image upload (drag & drop or click to upload)
// 2. Array field editors (FAQ items, icon grid items, etc)
// 3. DateTime picker for countdown_timer end_date
// 4. Media library browser (inline, not modal)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Plus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { PageBlock } from '@/lib/builder/types'

interface PropEditorProps {
    block: PageBlock
    onChange: (updated: PageBlock) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Media Library Inline (simplified)
// ─────────────────────────────────────────────────────────────────────────────
function MediaLibraryBrowser({ onSelect }: { onSelect: (url: string) => void }) {
    const [images, setImages] = useState<Array<{ url: string; name: string }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/admin/media-list')
            .then((r) => r.json())
            .then((data) => {
                setImages(data || [])
                setLoading(false)
            })
            .catch((err) => {
                console.error('Failed to load media:', err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return <div className="text-center py-8 text-gray-400">Loading media library...</div>
    }

    if (images.length === 0) {
        return <div className="text-center py-8 text-gray-400">No images yet. Upload one first.</div>
    }

    return (
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {images.map((img) => (
                <button
                    key={img.url}
                    type="button"
                    onClick={() => onSelect(img.url)}
                    className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all hover:shadow-lg"
                >
                    <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                </button>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Image Upload (Drag & Drop)
// ─────────────────────────────────────────────────────────────────────────────
function ImageUploadZone({
    value,
    onChange,
    label,
}: {
    value: string
    onChange: (url: string) => void
    label: string
}) {
    const [uploading, setUploading] = useState(false)
    const [showBrowser, setShowBrowser] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const file = files[0]
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/admin/upload-media', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            onChange(data.url)
            toast.success('Image uploaded!')
        } catch (err) {
            toast.error('Upload failed')
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {label}
            </label>

            {/* Drop zone */}
            <div
                ref={dropZoneRef}
                onDragOver={(e) => {
                    e.preventDefault()
                    dropZoneRef.current?.classList.add('border-blue-500', 'bg-blue-50')
                }}
                onDragLeave={() => {
                    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50')
                }}
                onDrop={(e) => {
                    e.preventDefault()
                    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50')
                    handleFileSelect(e.dataTransfer.files)
                }}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-gray-400"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full"
                    disabled={uploading}
                >
                    <Upload className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600">
                        {uploading ? 'Uploading...' : 'Drag image here or click to upload'}
                    </p>
                </button>
            </div>

            {/* Preview */}
            {value && (
                <img
                    src={value}
                    alt="preview"
                    className="w-full h-24 object-cover rounded border border-gray-200"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none'
                    }}
                />
            )}

            {/* Media browser button */}
            <button
                type="button"
                onClick={() => setShowBrowser(!showBrowser)}
                className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded transition-colors"
            >
                {showBrowser ? 'Hide Media Library' : 'Browse Media Library'}
            </button>

            {showBrowser && (
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <MediaLibraryBrowser onSelect={(url) => { onChange(url); setShowBrowser(false) }} />
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Array Item Editor (for FAQ items, icon grid items, etc)
// ─────────────────────────────────────────────────────────────────────────────
function ArrayItemEditor({
    items = [],
    onChange,
    itemTemplate,
    itemLabel,
}: {
    items: any[]
    onChange: (items: any[]) => void
    itemTemplate: any
    itemLabel: string
}) {
    const [expanded, setExpanded] = useState<string | null>(null)

    const addItem = () => {
        const newItem = {
            ...itemTemplate,
            id: `item_${Date.now()}`,
        }
        onChange([...items, newItem])
        setExpanded(newItem.id)
    }

    const removeItem = (id: string) => {
        onChange(items.filter((item) => item.id !== id))
    }

    const updateItem = (id: string, key: string, value: any) => {
        onChange(
            items.map((item) =>
                item.id === id ? { ...item, [key]: value } : item
            )
        )
    }

    return (
        <div className="space-y-2 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {itemLabel}
                </label>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add
                </button>
            </div>

            {items.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No items yet. Click Add to create one.</p>
            )}

            {items.map((item) => (
                <div
                    key={item.id}
                    className="border border-gray-200 rounded overflow-hidden bg-white"
                >
                    {/* Collapse toggle */}
                    <button
                        type="button"
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-xs font-semibold text-gray-700">
                            {item.question || item.label || `Item ${items.indexOf(item) + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                    expanded === item.id ? 'rotate-180' : ''
                                }`}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeItem(item.id)
                                }}
                                className="text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </button>

                    {/* Expanded fields */}
                    {expanded === item.id && (
                        <div className="px-3 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
                            {Object.entries(item)
                                .filter(([key]) => key !== 'id')
                                .map(([key, val]) => (
                                    <div key={key}>
                                        <label className="text-[9px] font-bold uppercase tracking-wide text-gray-500 block mb-1">
                                            {key.replace(/_/g, ' ')}
                                        </label>
                                        {typeof val === 'string' &&
                                        (key.includes('description') || key.includes('answer')) ? (
                                            <textarea
                                                value={val}
                                                onChange={(e) => updateItem(item.id, key, e.target.value)}
                                                rows={2}
                                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => updateItem(item.id, key, e.target.value)}
                                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PropEditor Component
// ─────────────────────────────────────────────────────────────────────────────
export function PropEditor({ block, onChange }: PropEditorProps) {
    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const props = block.props as unknown as Record<string, any>
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1'
    const FIELD =
        'w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

    return (
        <div className="space-y-4 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Block header */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div>
                    <p className="text-sm font-bold text-gray-900">{block.type}</p>
                    <p className="text-[10px] text-gray-400">Edit block properties</p>
                </div>
            </div>

            {/* Field rendering */}
            {Object.entries(props).map(([key, val]) => {
                const label = key.replace(/_/g, ' ')

                // Boolean
                if (typeof val === 'boolean') {
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={key}
                                checked={val}
                                onChange={(e) => set(key, e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <label htmlFor={key} className="text-xs text-gray-700 capitalize cursor-pointer">
                                {label}
                            </label>
                        </div>
                    )
                }

                // Number
                if (typeof val === 'number') {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input
                                type="number"
                                value={val}
                                onChange={(e) => set(key, Number(e.target.value))}
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // Enum fields (select)
                const ENUMS: Record<string, string[]> = {
                    align: ['left', 'center', 'right'],
                    height: ['sm', 'md', 'lg', 'full'],
                    filter: ['featured', 'bestsellers', 'sale', 'new'],
                    image_side: ['left', 'right'],
                    style: ['line', 'dots', 'ornament'],
                    urgent_color: ['red', 'orange', 'gold'],
                    columns: ['2', '3', '4'],
                }
                if (ENUMS[key]) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <select
                                value={String(val)}
                                onChange={(e) => set(key, e.target.value)}
                                className={FIELD}
                            >
                                {ENUMS[key].map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )
                }

                // DateTime (for countdown_timer)
                if (key === 'end_date' && typeof val === 'string') {
                    const dateStr = val.split('T')[0]
                    const timeStr = val.split('T')[1]?.slice(0, 5) || '23:59'
                    return (
                        <div key={key} className="space-y-2">
                            <label className={LABEL}>{label}</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateStr}
                                    onChange={(e) => {
                                        const newDate = new Date(`${e.target.value}T${timeStr}:00Z`)
                                        set(key, newDate.toISOString())
                                    }}
                                    className={`${FIELD} flex-1`}
                                />
                                <input
                                    type="time"
                                    value={timeStr}
                                    onChange={(e) => {
                                        const newDate = new Date(`${dateStr}T${e.target.value}:00Z`)
                                        set(key, newDate.toISOString())
                                    }}
                                    className={`${FIELD} w-24`}
                                />
                            </div>
                        </div>
                    )
                }

                // Image fields (with inline upload)
                if (typeof val === 'string' && key.includes('image')) {
                    return (
                        <ImageUploadZone
                            key={key}
                            value={val}
                            onChange={(newVal) => set(key, newVal)}
                            label={label}
                        />
                    )
                }

                // Array fields (FAQ items, icon grid items)
                if (Array.isArray(val)) {
                    if (key === 'items') {
                        // Detect item type based on first item
                        const firstItem = val[0]
                        if (firstItem?.question) {
                            // FAQ items
                            return (
                                <ArrayItemEditor
                                    key={key}
                                    items={val}
                                    onChange={(items) => set(key, items)}
                                    itemTemplate={{ question: '', answer: '' }}
                                    itemLabel="FAQ Items"
                                />
                            )
                        } else if (firstItem?.label) {
                            // Icon grid items
                            return (
                                <ArrayItemEditor
                                    key={key}
                                    items={val}
                                    onChange={(items) => set(key, items)}
                                    itemTemplate={{ icon: '⭐', label: '', description: '' }}
                                    itemLabel="Trust Signals"
                                />
                            )
                        }
                    }
                    return null
                }

                // Long text
                if (
                    typeof val === 'string' &&
                    (key.includes('body') ||
                        key.includes('quote') ||
                        key.includes('subheading') ||
                        key.includes('description'))
                ) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <textarea
                                value={val}
                                onChange={(e) => set(key, e.target.value)}
                                rows={3}
                                className={`${FIELD} resize-none`}
                            />
                        </div>
                    )
                }

                // Default text input
                return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input
                            type="text"
                            value={String(val)}
                            onChange={(e) => set(key, e.target.value)}
                            className={FIELD}
                        />
                    </div>
                )
            })}
        </div>
    )
}
