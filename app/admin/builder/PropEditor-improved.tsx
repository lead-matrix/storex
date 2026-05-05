'use client'

import { useState } from 'react'
import { PageBlock, BLOCK_CATALOGUE } from '@/lib/builder/types-extended'
import { Plus, Trash2 } from 'lucide-react'

function MediaPickerInline({ onSelect }: { onSelect: (url: string) => void }) {
  const [images, setImages] = useState<{url:string,name:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useState(() => {
    fetch('/api/admin/media-list')
      .then(r => r.json())
      .then(data => { setImages(data); setLoading(false) })
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/media-list', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        onSelect(data.url)
        setImages([...images, { url: data.url, name: file.name }])
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <p className='text-center text-gray-400 py-8'>Loading...</p>

  return (
    <div className='space-y-4'>
      <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
        <label className='cursor-pointer'>
          <input type='file' accept='image/*' onChange={handleUpload} className='hidden' disabled={uploading} />
          <p className='text-sm text-gray-600 font-medium'>
            {uploading ? 'Uploading...' : 'Drag or click to upload'}
          </p>
        </label>
      </div>

      {images.length > 0 && (
        <div>
          <p className='text-xs font-bold text-gray-500 mb-2 uppercase'>Or choose existing:</p>
          <div className='grid grid-cols-3 gap-3'>
            {images.map(img => (
              <button key={img.url} type='button' onClick={() => onSelect(img.url)}
                className='aspect-square rounded overflow-hidden border-2 border-transparent
                  hover:border-blue-500 transition-all'>
                <img src={img.url} alt={img.name} className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PropEditor({ block, onChange }: { block: PageBlock; onChange: (updated: PageBlock) => void }) {
    const [mediaTarget, setMediaTarget] = useState<string | null>(null)
    
    const set = (key: string, value: unknown) => {
        onChange({ ...block, props: { ...block.props, [key]: value } })
    }

    const props = block.props as unknown as Record<string, any>
    const def = BLOCK_CATALOGUE.find(d => d.type === block.type)
    const FIELD = 'w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    const LABEL = 'block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1'

    return (
        <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 sticky top-0 bg-white">
                <span className="text-lg">{def?.icon}</span>
                <div>
                    <p className="text-sm font-bold text-gray-900">{def?.label}</p>
                    <p className="text-[10px] text-gray-400">{def?.description}</p>
                </div>
            </div>

            {/* Fields */}
            {Object.entries(props).map(([key, val]) => {
                const label = key.replace(/_/g, ' ')

                // Boolean
                if (typeof val === 'boolean') return (
                    <div key={key} className="flex items-center gap-3">
                        <input type="checkbox" id={key} checked={val} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        <label htmlFor={key} className="text-xs text-gray-700 capitalize cursor-pointer">{label}</label>
                    </div>
                )

                // Number
                if (typeof val === 'number') return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input type="number" value={val} onChange={e => set(key, Number(e.target.value))} className={FIELD} />
                    </div>
                )

                // Enum fields (select)
                const ENUMS: Record<string, string[]> = {
                    align: ['left', 'center', 'right'],
                    height: ['sm', 'md', 'lg', 'full'],
                    filter: ['featured', 'bestsellers', 'sale', 'new'],
                    image_side: ['left', 'right'],
                    style: ['line', 'dots', 'ornament'],
                }
                if (ENUMS[key]) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <select value={String(val)} onChange={e => set(key, e.target.value)} className={FIELD}>
                            {ENUMS[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                )

                // Color picker
                if (key.includes('color')) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <div className='flex gap-2 items-center'>
                            <input type='color' value={val} onChange={e => set(key, e.target.value)} className='w-12 h-10 rounded cursor-pointer' />
                            <input type='text' value={val} onChange={e => set(key, e.target.value)} className={`${FIELD} flex-1 font-mono text-xs`} />
                        </div>
                    </div>
                )

                // DateTime picker
                if (key.includes('date') || key.includes('end_')) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <input type='datetime-local' value={String(val).slice(0, 16)} onChange={e => set(key, new Date(e.target.value).toISOString())} className={FIELD} />
                    </div>
                )

                // Long text (body fields)
                if (typeof val === 'string' && (key.includes('body') || key.includes('quote') || key.includes('subheading') || key.includes('description') || key.includes('message') || key.includes('answer'))) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <textarea value={val} rows={3} onChange={e => set(key, e.target.value)} className={`${FIELD} resize-none`} />
                    </div>
                )

                // Image URL
                if (typeof val === 'string' && key.includes('image')) return (
                    <div key={key}>
                        <label className={LABEL}>{label}</label>
                        <div className='flex gap-2 items-center mb-2'>
                            <input type='url' value={val} onChange={e => set(key, e.target.value)} placeholder='Paste image URL or click Browse' className={`${FIELD} flex-1`} />
                            <button type='button' onClick={() => setMediaTarget(key)} className='flex-shrink-0 px-3 py-2 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-700 whitespace-nowrap'>
                                Browse
                            </button>
                        </div>
                        {val && <img src={String(val)} alt='preview' onError={e => (e.currentTarget.style.display='none')} className='h-20 w-full object-cover rounded border border-gray-200' />}
                        {mediaTarget === key && (
                            <div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={() => setMediaTarget(null)}>
                                <div className='bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto' onClick={e => e.stopPropagation()}>
                                    <div className='flex justify-between mb-4'>
                                        <h3 className='font-bold text-gray-900'>Choose Image</h3>
                                        <button onClick={() => setMediaTarget(null)}>✕</button>
                                    </div>
                                    <MediaPickerInline onSelect={url => { set(key, url); setMediaTarget(null) }} />
                                </div>
                            </div>
                        )}
                    </div>
                )

                // Array fields (FAQ items, icon grid items, etc.)
                if (Array.isArray(val)) return (
                    <div key={key} className='border border-gray-200 rounded-lg p-3 bg-gray-50'>
                        <label className={LABEL}>{label}</label>
                        <div className='space-y-3 mt-3'>
                            {val.map((item, idx) => (
                                <div key={idx} className='bg-white p-3 rounded border border-gray-200'>
                                    {typeof item === 'object' && item !== null && (
                                        <>
                                            {Object.entries(item).map(([itemKey, itemVal]) => (
                                                <div key={itemKey} className='mb-2'>
                                                    <label className='text-[9px] font-bold uppercase text-gray-600'>{itemKey}</label>
                                                    <input
                                                        type={itemKey.includes('description') || itemKey.includes('answer') ? 'text' : 'text'}
                                                        value={String(itemVal)}
                                                        onChange={e => {
                                                            const newArr = [...val]
                                                            newArr[idx] = { ...item, [itemKey]: e.target.value }
                                                            set(key, newArr)
                                                        }}
                                                        className={`${FIELD} text-xs`}
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                type='button'
                                                onClick={() => set(key, val.filter((_: any, i: number) => i !== idx))}
                                                className='mt-2 w-full py-1 px-2 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 transition-all flex items-center justify-center gap-1'
                                            >
                                                <Trash2 className='w-3 h-3' /> Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                            <button
                                type='button'
                                onClick={() => {
                                    const newItem = val[0] ? { ...val[0] } : {}
                                    Object.keys(newItem).forEach(k => newItem[k] = '')
                                    set(key, [...val, newItem])
                                }}
                                className='w-full py-2 px-3 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 transition-all flex items-center justify-center gap-1'
                            >
                                <Plus className='w-3 h-3' /> Add {label.slice(0, -1)}
                            </button>
                        </div>
                    </div>
                )

                // Default text input
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
