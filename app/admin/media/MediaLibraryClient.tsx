'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import {
    Upload, X, Trash2, Copy, Check, Grid3X3, List, Filter,
    Image as ImageIcon, Loader2, Search, FolderOpen, RefreshCw,
    Download, Eye, FileImage, AlertTriangle, Edit3, Save
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import {
    updateFrontendContent,
    createFrontendContent,
    deleteFrontendContent
} from '@/app/admin/actions/frontend-actions'

interface MediaFile {
    id: string
    name: string
    path: string
    url: string
    size: number
    contentType: string
    createdAt: string
}

interface ContentBlock {
    id: string
    content_key: string
    content_data: Record<string, string>
    updated_at: string
}

interface Props {
    initialFiles: MediaFile[]
    bucketBase: string
    contentBlocks: ContentBlock[]
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const FIELD_LABELS: Record<string, string> = {
  hero_title: 'Hero Headline',
  hero_subtitle: 'Hero Subheadline',
  hero_cta_text: 'Hero Button Text',
  hero_cta_link: 'Hero Button Link (URL)',
  bestseller_heading: 'Bestsellers Section Title',
  bestseller_subheading: 'Bestsellers Subtitle',
  // NOTE: Announcement bar is now managed from the Settings page (site_settings table, announcement_messages key)
  brand_story_heading: 'Brand Story Heading',
  brand_story_body: 'Brand Story Body Text',
  newsletter_heading: 'Newsletter Section Title',
  newsletter_subheading: 'Newsletter Subtitle',
}

export default function MediaLibraryClient({ initialFiles, bucketBase, contentBlocks }: Props) {
    const [files, setFiles] = useState<MediaFile[]>(initialFiles)
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
    const [activeTab, setActiveTab] = useState<'media' | 'content'>('media')
    const [contentEdits, setContentEdits] = useState<Record<string, Record<string, string>>>({})
    const [savingContent, setSavingContent] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const supabase = createClient()

    // Filter files
    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    // Upload handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true)
        const newFiles: MediaFile[] = []

        const imageCompression = (await import('browser-image-compression')).default

        for (const file of acceptedFiles) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 20MB limit`)
                continue
            }

            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

            try {
                const compressedFile = await imageCompression(file, {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 2000,
                    fileType: 'image/webp' as any,
                    initialQuality: 0.85,
                    useWebWorker: true,
                    onProgress: (p: number) => setUploadProgress(prev => ({ ...prev, [file.name]: p }))
                })

                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
                const filePath = `products/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, compressedFile, {
                        cacheControl: '31536000',
                        upsert: false,
                        contentType: 'image/webp'
                    })

                if (uploadError) {
                    toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
                    continue
                }

                const publicUrl = `${bucketBase}/${filePath}`

                newFiles.push({
                    id: filePath,
                    name: fileName,
                    path: filePath,
                    url: publicUrl,
                    size: compressedFile.size,
                    contentType: 'image/webp',
                    createdAt: new Date().toISOString()
                })

                toast.success(`${file.name} uploaded successfully`)
            } catch (err: any) {
                toast.error(`Failed to process ${file.name}`)
            } finally {
                setTimeout(() => {
                    setUploadProgress(prev => {
                        const next = { ...prev }
                        delete next[file.name]
                        return next
                    })
                }, 1000)
            }
        }

        if (newFiles.length > 0) {
            setFiles(prev => [...newFiles, ...prev])
        }

        setUploading(false)
    }, [supabase, bucketBase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
        disabled: uploading
    })

    const copyUrl = async (url: string) => {
        await navigator.clipboard.writeText(url)
        setCopiedUrl(url)
        toast.success('URL copied to clipboard')
        setTimeout(() => setCopiedUrl(null), 2000)
    }

    const deleteFile = async (file: MediaFile) => {
        if (!confirm(`Delete "${file.name}"? This is permanent.`)) return

        const { error } = await supabase.storage
            .from('product-images')
            .remove([file.path])

        if (error) {
            toast.error(`Failed to delete: ${error.message}`)
            return
        }

        setFiles(prev => prev.filter(f => f.id !== file.id))
        setSelectedFiles(prev => {
            const next = new Set(prev)
            next.delete(file.id)
            return next
        })
        toast.success('File deleted from vault')
    }

    const deleteSelected = async () => {
        if (!confirm(`Delete ${selectedFiles.size} selected files? This is permanent.`)) return
        const paths = files.filter(f => selectedFiles.has(f.id)).map(f => f.path)

        const { error } = await supabase.storage.from('product-images').remove(paths)
        if (error) {
            toast.error(`Batch delete failed: ${error.message}`)
            return
        }

        setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)))
        setSelectedFiles(new Set())
        toast.success(`${paths.length} files removed from vault`)
    }

    const toggleSelect = (id: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            setSelectedFiles(new Set())
        } else {
            setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
        }
    }

    const refreshLibrary = async () => {
        setRefreshing(true)
        window.location.reload()
    }

    // Content editor handlers
    const getContentValue = (block: ContentBlock, key: string) => {
        return contentEdits[block.id]?.[key] ?? block.content_data?.[key] ?? ''
    }

    const setContentValue = (blockId: string, key: string, value: string) => {
        setContentEdits(prev => ({
            ...prev,
            [blockId]: { ...(prev[blockId] ?? {}), [key]: value }
        }))
    }

    const saveContentBlock = async (block: ContentBlock) => {
        setSavingContent(block.id)
        const merged = { ...block.content_data, ...(contentEdits[block.id] ?? {}) }

        try {
            const result = await updateFrontendContent(block.content_key, merged)

            if (result.success) {
                toast.success(`Content block "${block.content_key}" synchronized with vault`)
                // Clear local edits
                setContentEdits(prev => {
                    const next = { ...prev }
                    delete next[block.id]
                    return next
                })
            } else {
                toast.error(`Sync failed: ${result.error}`)
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to contact vault")
        } finally {
            setSavingContent(null)
        }
    }

    const deleteBlockAction = async (contentKey: string) => {
        if (!confirm(`Permanently delete "${contentKey}"? This will vanish from the storefront.`)) return

        try {
            const result = await deleteFrontendContent(contentKey)
            if (result.success) {
                toast.success(`Content block "${contentKey}" destroyed`)
                window.location.reload()
            } else {
                toast.error(`Destruction failed: ${result.error}`)
            }
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const createBlockAction = async () => {
        const key = prompt("Enter a unique Content Key (e.g. footer_legal_text):")
        if (!key) return

        try {
            const result = await createFrontendContent(key, 'text_block', {
                body: "Enter content here..."
            })

            if (result.success) {
                toast.success(`Matrix generated for "${key}"`)
                window.location.reload()
            } else {
                toast.error(`Generation failed: ${result.error}`)
            }
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury">Media Library</h1>
                    <p className="text-luxury-subtext text-xs uppercase tracking-luxury font-medium">
                        Image & Content Command Center
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshLibrary}
                        className="flex items-center gap-2 bg-[#121214] border border-white/10 px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold text-luxury-subtext hover:text-gold hover:border-gold/30 transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    {activeTab === 'content' && (
                        <button
                            onClick={createBlockAction}
                            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-all"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Generate Block
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0B0B0D]/5 border border-white/10 rounded-lg p-1 w-fit">
                {[
                    { id: 'media', label: 'Images & Files', icon: ImageIcon },
                    { id: 'content', label: 'Text Content', icon: Edit3 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'media' | 'content')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-[10px] uppercase tracking-widest font-bold transition-all
                            ${activeTab === tab.id
                                ? 'bg-[#0B0B0D] text-white shadow-sm border border-white/5'
                                : 'text-luxury-subtext hover:text-white'}`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── MEDIA TAB ─── */}
            {activeTab === 'media' && (
                <div className="space-y-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Media', value: files.length, color: 'text-white' },
                            { label: 'Library Size', value: formatBytes(totalSize), color: 'text-gold' },
                            { label: 'Selected', value: selectedFiles.size, color: 'text-blue-500' },
                            { label: 'Filtered', value: filteredFiles.length, color: 'text-emerald-500' },
                        ].map(s => (
                            <div key={s.label} className="bg-[#0B0B0D] rounded-xl border border-white/10 p-5 shadow-sm">
                                <p className="text-[9px] uppercase tracking-widest text-luxury-subtext font-medium mb-2">{s.label}</p>
                                <p className={`text-2xl font-serif ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Upload Zone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                            ${isDragActive
                                ? 'border-gold bg-gold/5 scale-[0.99]'
                                : 'border-white/10/20 hover:border-gold/50 bg-[#0B0B0D]/5 hover:bg-[#0B0B0D]/5'}
                            ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all
                                ${isDragActive ? 'bg-gold text-white scale-110' : 'bg-[#121214] text-luxury-subtext/40'}`}>
                                {uploading
                                    ? <Loader2 className="w-8 h-8 animate-spin" />
                                    : <Upload className={`w-8 h-8 ${isDragActive ? 'animate-bounce' : ''}`} />}
                            </div>
                            <div>
                                <p className="text-base font-medium text-white tracking-wide">
                                    {isDragActive ? 'Release to upload' : 'Drop images or click to upload'}
                                </p>
                                <p className="text-[10px] text-luxury-subtext/60 uppercase tracking-widest mt-1">
                                    PNG, JPG, WebP, GIF · Auto-optimized to WebP · Max 20MB per file
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-2">
                            {Object.entries(uploadProgress).map(([name, progress]) => (
                                <div key={name} className="bg-[#0B0B0D] border border-white/10 rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] text-luxury-subtext truncate uppercase tracking-widest">{name}</span>
                                        <span className="text-[10px] text-gold font-mono font-bold">{progress}%</span>
                                    </div>
                                    <div className="h-1 bg-[#121214] rounded-full overflow-hidden">
                                        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative flex-grow max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-subtext/40" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-[#0B0B0D] border border-white/10 rounded-lg text-xs text-white outline-none focus:border-gold/50 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {selectedFiles.size > 0 && (
                                <>
                                    <span className="text-[10px] text-luxury-subtext uppercase tracking-widest">
                                        {selectedFiles.size} selected
                                    </span>
                                    <button
                                        onClick={deleteSelected}
                                        className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-red-100 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Selected
                                    </button>
                                </>
                            )}

                            <button
                                onClick={selectAll}
                                className="text-[9px] uppercase tracking-widest text-luxury-subtext/60 hover:text-gold transition-colors px-3 py-2"
                            >
                                {selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
                            </button>

                            <div className="flex border border-white/10 rounded-lg overflow-hidden">
                                {(['grid', 'list'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`p-2.5 transition-colors ${viewMode === mode ? 'bg-white text-white' : 'bg-[#0B0B0D] text-luxury-subtext hover:text-white'}`}
                                    >
                                        {mode === 'grid' ? <Grid3X3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* File Grid / List */}
                    {filteredFiles.length === 0 ? (
                        <div className="py-32 text-center border border-dashed border-white/10 rounded-xl bg-[#121214]/20">
                            <FolderOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-luxury-subtext text-[10px] uppercase tracking-widest">
                                {searchQuery ? 'No media match your search' : 'No media in library. Upload your first image above.'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-[#121214]
                                        ${selectedFiles.has(file.id)
                                            ? 'border-gold shadow-lg shadow-gold/10'
                                            : 'border-white/10 hover:border-gold/40'}`}
                                    onClick={() => toggleSelect(file.id)}
                                >
                                    {/* Image */}
                                    <div className="aspect-square relative bg-white/5">
                                        <Image
                                            src={file.url}
                                            alt={file.name}
                                            fill
                                            className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                            unoptimized
                                        />

                                        {/* Selection Overlay */}
                                        {selectedFiles.has(file.id) && (
                                            <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                                <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center shadow-lg">
                                                    <Check className="w-4 h-4 text-black" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                                            onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setPreviewFile(file)}
                                                className="p-2 bg-[#0B0B0D]/10 rounded-lg hover:bg-[#0B0B0D]/20 text-white transition-colors"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => copyUrl(file.url)}
                                                className="p-2 bg-[#0B0B0D]/10 rounded-lg hover:bg-gold text-white transition-colors"
                                                title="Copy URL"
                                            >
                                                {copiedUrl === file.url ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => deleteFile(file)}
                                                className="p-2 bg-[#0B0B0D]/10 rounded-lg hover:bg-red-500 text-white transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2 bg-[#0B0B0D]">
                                        <p className="text-[9px] text-white font-medium truncate">{file.name}</p>
                                        <p className="text-[8px] text-luxury-subtext/50 mt-0.5">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div className="bg-[#0B0B0D] border border-white/10 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-[#0B0B0D]/5">
                                        <th className="text-left p-4 text-[9px] uppercase tracking-widest text-luxury-subtext font-bold w-10">
                                            <button onClick={selectAll} className="text-luxury-subtext hover:text-gold transition-colors">
                                                {selectedFiles.size === filteredFiles.length ? '✓' : '○'}
                                            </button>
                                        </th>
                                        <th className="text-left p-4 text-[9px] uppercase tracking-widest text-luxury-subtext font-bold">Media</th>
                                        <th className="text-left p-4 text-[9px] uppercase tracking-widest text-luxury-subtext font-bold">Size</th>
                                        <th className="text-left p-4 text-[9px] uppercase tracking-widest text-luxury-subtext font-bold">Date</th>
                                        <th className="text-right p-4 text-[9px] uppercase tracking-widest text-luxury-subtext font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map(file => (
                                        <tr key={file.id}
                                            className={`border-b border-white/5 hover:bg-[#121214]/20 transition-colors ${selectedFiles.has(file.id) ? 'bg-gold/5' : ''}`}>
                                            <td className="p-4">
                                                <button onClick={() => toggleSelect(file.id)}
                                                    className={`transition-colors ${selectedFiles.has(file.id) ? 'text-gold' : 'text-luxury-subtext/30 hover:text-gold'}`}>
                                                    {selectedFiles.has(file.id) ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border border-white/10/20 rounded" />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded overflow-hidden bg-[#121214] flex-shrink-0">
                                                        <Image src={file.url} alt={file.name} width={40} height={40} className="object-contain object-center w-full h-full" unoptimized />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white font-medium truncate max-w-[200px]">{file.name}</p>
                                                        <p className="text-[9px] text-luxury-subtext/50 uppercase tracking-widest">
                                                            {file.contentType.split('/')[1].toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-[10px] text-luxury-subtext font-mono">{formatBytes(file.size)}</td>
                                            <td className="p-4 text-[10px] text-luxury-subtext">{formatDate(file.createdAt)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setPreviewFile(file)}
                                                        className="p-1.5 text-luxury-subtext/40 hover:text-blue-500 transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => copyUrl(file.url)}
                                                        className="p-1.5 text-luxury-subtext/40 hover:text-gold transition-colors"
                                                        title="Copy URL"
                                                    >
                                                        {copiedUrl === file.url ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteFile(file)}
                                                        className="p-1.5 text-luxury-subtext/40 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── CONTENT TAB ─── */}
            {activeTab === 'content' && (
                <div className="space-y-6">
                    <p className="text-luxury-subtext text-xs uppercase tracking-luxury font-medium">
                        Edit text content blocks that power your storefront. Changes are saved directly to the database.
                    </p>

                    {contentBlocks.length === 0 ? (
                        <div className="py-24 text-center border border-dashed border-white/10 rounded-xl">
                            <Edit3 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-luxury-subtext text-[10px] uppercase tracking-widest">No frontend content blocks found</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {contentBlocks.map(block => (
                                <div key={block.id} className="bg-[#0B0B0D] border border-white/10 rounded-xl shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0B0B0D]/5">
                                        <div>
                                            <h3 className="text-[11px] uppercase tracking-widest text-white font-bold">
                                                {block.content_key.replace(/_/g, ' ')}
                                            </h3>
                                            <p className="text-[9px] text-luxury-subtext/50 mt-0.5 uppercase tracking-widest">
                                                Last updated: {formatDate(block.updated_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => deleteBlockAction(block.content_key)}
                                                className="p-2 text-luxury-subtext/20 hover:text-red-500 transition-colors"
                                                title="Destroy Block"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => saveContentBlock(block)}
                                                disabled={savingContent === block.id || !contentEdits[block.id]}
                                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all
                                                    ${contentEdits[block.id]
                                                        ? 'bg-white text-black hover:bg-gold'
                                                        : 'bg-[#121214] text-luxury-subtext/30 cursor-not-allowed'}`}
                                            >
                                                {savingContent === block.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Save className="w-3.5 h-3.5" />}
                                                Save Block
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {Object.entries(block.content_data ?? {}).map(([key, value]) => (
                                            <div key={key} className="space-y-1.5">
                                                <label className="text-[9px] uppercase tracking-widest text-luxury-subtext/60 font-bold">
                                                    {FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </label>
                                                {typeof value === 'string' && value.length > 80 ? (
                                                    <textarea
                                                        rows={3}
                                                        value={getContentValue(block, key)}
                                                        onChange={e => setContentValue(block.id, key, e.target.value)}
                                                        className="w-full bg-[#121214] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all resize-none"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={getContentValue(block, key)}
                                                        onChange={e => setContentValue(block.id, key, e.target.value)}
                                                        className="w-full bg-[#121214] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewFile(null)}
                >
                    <div
                        className="bg-[#0B0B0D] rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div>
                                <h3 className="font-medium text-white truncate">{previewFile.name}</h3>
                                <p className="text-[9px] text-luxury-subtext uppercase tracking-widest mt-0.5">
                                    {formatBytes(previewFile.size)} · {previewFile.contentType.toUpperCase()}
                                </p>
                            </div>
                            <button onClick={() => setPreviewFile(null)} className="p-2 text-luxury-subtext hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative bg-[#0B0B0D]/5" style={{ height: 400 }}>
                            <Image
                                src={previewFile.url}
                                alt={previewFile.name}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>

                        <div className="px-6 py-4 flex items-center gap-3 border-t border-white/5">
                            <input
                                type="text"
                                readOnly
                                value={previewFile.url}
                                className="flex-grow bg-[#121214] border border-white/10 rounded-lg px-4 py-2.5 text-[10px] text-luxury-subtext font-mono outline-none"
                            />
                            <button
                                onClick={() => copyUrl(previewFile.url)}
                                className="flex items-center gap-2 bg-white text-white px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-all"
                            >
                                {copiedUrl === previewFile.url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                Copy URL
                            </button>
                            <a
                                href={previewFile.url}
                                download={previewFile.name}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-[#121214] border border-white/10 px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold text-luxury-subtext hover:text-gold hover:border-gold/30 transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
