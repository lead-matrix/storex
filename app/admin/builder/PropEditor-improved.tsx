'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Improved PropEditor — Drag-drop image upload + array field editing
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { PageBlock } from '@/lib/builder/types-extended'
import { BLOCK_CATALOGUE } from '@/lib/builder/types-extended'

interface PropEditorProps {
    block: PageBlock
    onChange: (updated: PageBlock) => void
}

export function PropEditor({ block, onChange }: PropEditorProps) {
    const [mediaList, setMediaList] = useState<{ url: string; name: string }[]>([])
    const [mediaLoading, setMediaLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [mediaTarget, setMediaTarget] = useState<string | null>(null)
    const [openArrays, setOpenArrays] = useState<Set<string>>(new Set())

    const fileInputRef = useRef<HTMLInputElement>(null)

    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const props = block.props as unknown as Record<string, any>
    const def = BLOCK_CATALOGUE.find(d => d.type === block.type)

    const FIELD =
        'w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-600 mb-1'

    // Load media library
    useEffect(() => {
        const loadMedia = async () => {
            setMediaLoading(true)
            try {
                const res = await fetch('/api/admin/media-list')
                const data = await res.json()
                setMediaList(data || [])
            } catch (err) {
                console.error('Failed to load media:', err)
            } finally {
                setMediaLoading(false)
            }
        }
        loadMedia()
    }, [])

    // Handle drag-drop image upload
    const handleDragDropImage = async (
        e: React.DragEvent<HTMLDivElement>,
        key: string
    ) => {
        e.preventDefault()
        e.stopPropagation()

        const files = e.dataTransfer.files
        if (files.length === 0) return

        const file = files[0]
        if (!file.type.startsWith('image/')) {
            alert('Please drop an image file')
            return
        }

        await uploadImage(file, key)
    }

    // Handle file input
    const handleFileSelect = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files
        if (files && files.length > 0) {
            await uploadImage(files[0], key)
        }
    }

    // Upload image to Supabase
    const uploadImage = async (file: File, key: string) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/admin/media-upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')
            const { url } = await res.json()
            set(key, url)

            // Refresh media list
            const mediaRes = await fetch('/api/admin/media-list')
            setMediaList(await mediaRes.json())
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Image upload failed. Try again.')
        } finally {
            setUploading(false)
        }
    }

    const toggleArrayEditor = (key: string) => {
        const newOpen = new Set(openArrays)
        if (newOpen.has(key)) {
            newOpen.delete(key)
        } else {
            newOpen.add(key)
        }
        setOpenArrays(newOpen)
    }

    const addArrayItem = (key: string) => {
        const arr = (props[key] as any[]) || []
        const newItem = {
            id: `${Date.now()}-${Math.random()}`,
            ...Object.fromEntries(
                Object.keys(arr[0] || {}).map((k) => [k, k === 'id' ? `${Date.now()}` : ''])
            ),
        }
        set(key, [...arr, newItem])
    }

    const removeArrayItem = (key: string, index: number) => {
        const arr = (props[key] as any[]) || []
        set(
            key,
            arr.filter((_, i) => i !== index)
        )
    }

    const updateArrayItem = (key: string, index: number, itemKey: string, value: unknown) => {
        const arr = (props[key] as any[]) || []
        const updated = [...arr]
        updated[index] = { ...updated[index], [itemKey]: value }
        set(key, updated)
    }

    return (
        <div className="space-y-4 p-4 max-h-[calc(100vh-200px)] overflow-y-auto bg-gray-100">
            {/* Block Header */}
            <div className="flex items-center gap-2 pb-3 border-b-2 border-gray-300 bg-white p-3 rounded">
                <span className="text-xl">{def?.icon}</span>
                <div>
                    <p className="text-sm font-bold text-gray-900">{def?.label}</p>
                    <p className="text-[10px] text-gray-500">{def?.description}</p>
                </div>
            </div>

            {/* Form Fields */}
            {Object.entries(props).map(([key, val]) => {
                const label = key.replace(/_/g, ' ')

                // BOOLEAN
                if (typeof val === 'boolean') {
                    return (
                        <div key={key} className="flex items-center gap-3 bg-white p-3 rounded">
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

                // NUMBER
                if (typeof val === 'number') {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
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

                // ENUM / SELECT
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
                        <div key={key} className="bg-white p-3 rounded">
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

                // ARRAY (icon_grid items, faq items, etc.)
                if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                    const isOpen = openArrays.has(key)
                    return (
                        <div key={key} className="bg-white p-4 rounded border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className={LABEL}>{label}</label>
                                <button
                                    type="button"
                                    onClick={() => toggleArrayEditor(key)}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                    {isOpen ? 'Hide' : 'Edit'}
                                </button>
                            </div>

                            {isOpen && (
                                <>
                                    {val.map((item, idx) => (
                                        <div key={item.id || idx} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                                            {Object.entries(item).map(([itemKey, itemVal]) => (
                                                <div key={itemKey} className="mb-3">
                                                    <label className="block text-[9px] font-bold uppercase text-gray-600 mb-1">
                                                        {itemKey}
                                                    </label>
                                                    {itemKey === 'id' ? (
                                                        <input
                                                            type="text"
                                                            value={String(itemVal)}
                                                            disabled
                                                            className="w-full bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 opacity-50 cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        <input
                                                            type={typeof itemVal === 'number' ? 'number' : 'text'}
                                                            value={String(itemVal || '')}
                                                            onChange={(e) =>
                                                                updateArrayItem(
                                                                    key,
                                                                    idx,
                                                                    itemKey,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem(key, idx)}
                                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addArrayItem(key)}
                                        className="w-full px-3 py-2 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add {label}
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }

                // LONG TEXT
                if (
                    typeof val === 'string' &&
                    (key.includes('body') ||
                        key.includes('quote') ||
                        key.includes('answer') ||
                        key.includes('description') ||
                        key.includes('subheading'))
                ) {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
                            <label className={LABEL}>{label}</label>
                            <textarea
                                value={val}
                                rows={3}
                                onChange={(e) => set(key, e.target.value)}
                                className={`${FIELD} resize-none`}
                            />
                        </div>
                    )
                }

                // HEX COLOR
                if (typeof val === 'string' && (key.includes('color') || key.includes('background'))) {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
                            <label className={LABEL}>{label}</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={val}
                                    onChange={(e) => set(key, e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => set(key, e.target.value)}
                                    placeholder="#000000"
                                    className={`${FIELD} flex-1`}
                                />
                            </div>
                        </div>
                    )
                }

                // DATETIME (for countdown timer)
                if (typeof val === 'string' && (key.includes('date') || key.includes('time'))) {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
                            <label className={LABEL}>{label}</label>
                            <input
                                type="datetime-local"
                                value={val.slice(0, 16)}
                                onChange={(e) => {
                                    const localDate = new Date(e.target.value)
                                    set(key, localDate.toISOString())
                                }}
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // IMAGE URL — Drag-drop + file picker + browse library
                if (typeof val === 'string' && key.includes('image')) {
                    return (
                        <div key={key} className="bg-white p-4 rounded">
                            <label className={LABEL}>{label}</label>

                            {/* URL Input + Browse Button */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="url"
                                    value={val}
                                    onChange={(e) => set(key, e.target.value)}
                                    placeholder="Paste URL or drag image below"
                                    className={`${FIELD} flex-1`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMediaTarget(key)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 whitespace-nowrap"
                                >
                                    Browse
                                </button>
                            </div>

                            {/* Drag-Drop Zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.add('bg-blue-100', 'border-blue-500')
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500')
                                }}
                                onDrop={(e) => {
                                    e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500')
                                    handleDragDropImage(e, key)
                                }}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-all mb-3 bg-gray-50"
                            >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-600">
                                    Drag image here or <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-600 font-bold hover:underline"
                                    >
                                        click to upload
                                    </button>
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(key, e)}
                                />
                            </div>

                            {/* Preview */}
                            {val && (
                                <img
                                    src={val}
                                    alt="preview"
                                    onError={(e) => {
                                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                    }}
                                    className="h-24 w-full object-cover rounded border border-gray-200 mb-3"
                                />
                            )}

                            {uploading && (
                                <p className="text-xs text-blue-600 font-bold">Uploading...</p>
                            )}
                        </div>
                    )
                }

                // VIDEO URL
                if (typeof val === 'string' && (key.includes('video') || key.includes('mux'))) {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
                            <label className={LABEL}>{label}</label>
                            <input
                                type="url"
                                value={val}
                                onChange={(e) => set(key, e.target.value)}
                                placeholder="https://..."
                                className={FIELD}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Paste Mux video URL
                            </p>
                        </div>
                    )
                }

                // LINK / URL
                if (typeof val === 'string' && (key.includes('link') || key.includes('url'))) {
                    return (
                        <div key={key} className="bg-white p-3 rounded">
                            <label className={LABEL}>{label}</label>
                            <input
                                type="text"
                                value={val}
                                onChange={(e) => set(key, e.target.value)}
                                placeholder="/shop, https://..."
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // DEFAULT TEXT
                return (
                    <div key={key} className="bg-white p-3 rounded">
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

            {/* Media Library Modal */}
            {mediaTarget && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setMediaTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">Media Library</h3>
                            <button
                                onClick={() => setMediaTarget(null)}
                                className="text-2xl text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {mediaLoading ? (
                            <p className="text-center text-gray-400 py-8">Loading...</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {mediaList.map((img) => (
                                    <button
                                        key={img.url}
                                        type="button"
                                        onClick={() => {
                                            set(mediaTarget, img.url)
                                            setMediaTarget(null)
                                        }}
                                        className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
