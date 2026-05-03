'use client'

import { useState } from 'react'
import { PageBlock, BLOCK_CATALOGUE } from '@/lib/builder/types-extended'
import { X, Plus, Upload } from 'lucide-react'

interface PropEditorProps {
    block: PageBlock
    onChange: (updated: PageBlock) => void
}

function MediaPickerInline({ onSelect }: { onSelect: (url: string) => void }) {
    const [images, setImages] = useState<{ url: string; name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useState(() => {
        fetch('/api/admin/media-list')
            .then(r => r.json())
            .then(data => { setImages(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        setUploading(true)
        for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)

            try {
                const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData })
                const data = await res.json()
                if (data.url) {
                    onSelect(data.url)
                    setImages(prev => [...prev, { url: data.url, name: file.name }])
                }
            } catch (err) {
                console.error('Upload failed:', err)
            }
        }
        setUploading(false)
    }

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-blue-400 rounded-lg p-6 text-center">
                <label className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-6 h-6 text-blue-400 mb-2" />
                    <span className="text-sm font-semibold text-gray-900">Drag or click to upload</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
                {uploading && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
            </div>

            {loading ? (
                <p className="text-center text-gray-400 py-8">Loading media library...</p>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {images.map(img => (
                        <button
                            key={img.url}
                            type="button"
                            onClick={() => onSelect(img.url)}
                            className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                        >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function PropEditor({ block, onChange }: PropEditorProps) {
    const [mediaTarget, setMediaTarget] = useState<string | null>(null)
    const [expandedArrays, setExpandedArrays] = useState<Record<string, boolean>>({})

    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const props = block.props as unknown as Record<string, any>
    const def = BLOCK_CATALOGUE.find(d => d.type === block.type)

    const FIELD = 'w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1'

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <span className="text-lg">{def?.icon}</span>
                <div>
                    <p className="text-sm font-bold text-gray-900">{def?.label}</p>
                    <p className="text-[10px] text-gray-400">{def?.description}</p>
                </div>
            </div>

            {Object.entries(props).map(([key, val]) => {
                const label = key.replace(/_/g, ' ')

                // Boolean toggle
                if (typeof val === 'boolean') {
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={key}
                                checked={val}
                                onChange={e => set(key, e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <label htmlFor={key} className="text-xs text-gray-700 capitalize cursor-pointer">
                                {label}
                            </label>
                        </div>
                    )
                }

                // Number input
                if (typeof val === 'number') {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input
                                type="number"
                                value={val}
                                onChange={e => set(key, Number(e.target.value))}
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // Array fields (FAQ items, icon grid items, etc.)
                if (Array.isArray(val)) {
                    const isExpanded = expandedArrays[key]
                    return (
                        <div key={key} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <button
                                type="button"
                                onClick={() =>
                                    setExpandedArrays(prev => ({ ...prev, [key]: !isExpanded }))
                                }
                                className="w-full flex items-center justify-between font-bold text-sm text-gray-900"
                            >
                                <span>{label}</span>
                                <span>{isExpanded ? '▼' : '▶'}</span>
                            </button>

                            {isExpanded && (
                                <div className="mt-3 space-y-3">
                                    {(val as any[]).map((item, idx) => {
                                        const itemKey = `${key}[${idx}]`
                                        return (
                                            <div key={itemKey} className="bg-white p-3 border border-gray-200 rounded">
                                                {typeof item === 'object' && item !== null ? (
                                                    <div className="space-y-2">
                                                        {Object.entries(item).map(([itemKey, itemVal]) => (
                                                            <div key={itemKey}>
                                                                <label className={LABEL}>{itemKey}</label>
                                                                <input
                                                                    type="text"
                                                                    value={String(itemVal)}
                                                                    onChange={e => {
                                                                        const newArray = [...val]
                                                                        newArray[idx] = {
                                                                            ...newArray[idx],
                                                                            [itemKey]: e.target.value,
                                                                        }
                                                                        set(key, newArray)
                                                                    }}
                                                                    className={FIELD}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={String(item)}
                                                        onChange={e => {
                                                            const newArray = [...val]
                                                            newArray[idx] = e.target.value
                                                            set(key, newArray)
                                                        }}
                                                        className={FIELD}
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newArray = val.filter((_: any, i: number) => i !== idx)
                                                        set(key, newArray)
                                                    }}
                                                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-semibold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )
                                    })}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newArray = [...val, val[0]]
                                            set(key, newArray)
                                        }}
                                        className="w-full flex items-center gap-2 justify-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-2 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add {label.slice(0, -1)}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }

                // Enum / select dropdowns
                const ENUMS: Record<string, string[]> = {
                    align: ['left', 'center', 'right'],
                    height: ['sm', 'md', 'lg', 'full'],
                    filter: ['featured', 'bestsellers', 'sale', 'new'],
                    image_side: ['left', 'right'],
                    style: ['line', 'dots', 'ornament'],
                    urgent_color: ['red', 'gold', 'white'],
                    columns: ['2', '3', '4'],
                }
                if (ENUMS[key]) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <select
                                value={String(val)}
                                onChange={e => set(key, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                                className={FIELD}
                            >
                                {ENUMS[key].map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )
                }

                // DateTime picker for countdown dates
                if (key.includes('date') && typeof val === 'string') {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <input
                                type="datetime-local"
                                value={val.slice(0, 16)}
                                onChange={e => set(key, new Date(e.target.value).toISOString())}
                                className={FIELD}
                            />
                        </div>
                    )
                }

                // Text area for long text
                if (
                    typeof val === 'string' &&
                    (key.includes('body') ||
                        key.includes('quote') ||
                        key.includes('subheading') ||
                        key.includes('description') ||
                        key.includes('answer'))
                ) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <textarea
                                value={val}
                                rows={3}
                                onChange={e => set(key, e.target.value)}
                                className={`${FIELD} resize-none`}
                            />
                        </div>
                    )
                }

                // Image URL with media picker + inline upload
                if (typeof val === 'string' && key.includes('image')) {
                    return (
                        <div key={key}>
                            <label className={LABEL}>{label}</label>
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    type="url"
                                    value={val}
                                    onChange={e => set(key, e.target.value)}
                                    placeholder="Paste URL or click Browse"
                                    className={`${FIELD} flex-1`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMediaTarget(key)}
                                    className="flex-shrink-0 px-3 py-2 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-700 whitespace-nowrap"
                                >
                                    Browse
                                </button>
                            </div>
                            {val && (
                                <img
                                    src={val}
                                    alt="preview"
                                    onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                                    className="h-24 w-full object-cover rounded border border-gray-200"
                                />
                            )}
                            {mediaTarget === key && (
                                <div
                                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                                    onClick={() => setMediaTarget(null)}
                                >
                                    <div
                                        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between mb-4">
                                            <h3 className="font-bold text-gray-900">Media Library</h3>
                                            <button
                                                onClick={() => setMediaTarget(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <MediaPickerInline
                                            onSelect={url => {
                                                set(key, url)
                                                setMediaTarget(null)
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
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
                            onChange={e => set(key, e.target.value)}
                            className={FIELD}
                        />
                    </div>
                )
            })}
        </div>
    )
}
