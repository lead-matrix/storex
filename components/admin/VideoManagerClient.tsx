'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Upload, Loader2, Check, Trash2, Play, X, Edit3, Save,
    Film, Clock, AlertCircle, RefreshCw, Copy, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface Video {
    id: string
    title: string | null
    description: string | null
    mux_asset_id: string
    mux_playback_id: string
    mux_upload_id: string | null
    thumbnail_url: string | null
    status: 'uploading' | 'processing' | 'ready' | 'errored'
    duration: number | null
    aspect_ratio: string | null
    created_at: string
}

const STATUS_STYLES: Record<string, string> = {
    ready: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50',
    processing: 'bg-amber-950/50 text-amber-400 border-amber-800/50',
    uploading: 'bg-blue-950/50 text-blue-400 border-blue-800/50',
    errored: 'bg-red-950/50 text-red-400 border-red-800/50',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
    ready: <Check className="w-3 h-3" />,
    processing: <Loader2 className="w-3 h-3 animate-spin" />,
    uploading: <Upload className="w-3 h-3 animate-pulse" />,
    errored: <AlertCircle className="w-3 h-3" />,
}

function formatDuration(secs: number | null): string {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface EditModalProps {
    video: Video
    onClose: () => void
    onSave: (id: string, title: string, description: string) => Promise<void>
}

function EditModal({ video, onClose, onSave }: EditModalProps) {
    const [title, setTitle] = useState(video.title || '')
    const [description, setDescription] = useState(video.description || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave(video.id, title, description)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0D0D0F] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                    <h3 className="text-sm font-bold text-white uppercase tracking-luxury">Edit Video Metadata</h3>
                    <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Title</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter video title..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Enter description..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 transition-colors resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-gold text-black py-3 rounded-xl text-[10px] uppercase tracking-luxury font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Changes
                        </button>
                        <button onClick={onClose} className="px-6 border border-white/10 text-white/40 rounded-xl text-[10px] uppercase tracking-luxury font-bold hover:text-white transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface VideoCardProps {
    video: Video
    onDelete: (id: string) => void
    onEdit: (video: Video) => void
    onCopyId: (id: string) => void
}

function VideoCard({ video, onDelete, onEdit, onCopyId }: VideoCardProps) {
    const isReady = video.status === 'ready'

    return (
        <div className="bg-[#0D0D0F] border border-white/[0.06] rounded-2xl overflow-hidden group hover:border-gold/20 transition-all">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black/40">
                {video.thumbnail_url && isReady ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title || 'Video'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-2">
                        <Film className="w-10 h-10" />
                        <p className="text-[9px] uppercase tracking-widest">
                            {video.status === 'uploading' ? 'Uploading...' : video.status === 'processing' ? 'Processing...' : 'Error'}
                        </p>
                    </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-2 right-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-luxury border rounded-full px-2.5 py-1 ${STATUS_STYLES[video.status] || STATUS_STYLES.errored}`}>
                    {STATUS_ICONS[video.status]}
                    {video.status}
                </div>

                {/* Duration */}
                {isReady && video.duration && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDuration(video.duration)}
                    </div>
                )}

                {/* Hover overlay with preview link */}
                {isReady && (
                    <a
                        href={`https://stream.mux.com/${video.mux_playback_id}.m3u8`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 hover:border-gold hover:bg-gold/20 transition-all">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                    </a>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <p className="text-white font-medium text-sm truncate">
                        {video.title || <span className="text-white/30 italic">Untitled</span>}
                    </p>
                    {video.description && (
                        <p className="text-white/40 text-[11px] mt-0.5 line-clamp-2">{video.description}</p>
                    )}
                    <p className="text-white/20 text-[9px] uppercase tracking-widest mt-1">{formatDate(video.created_at)}</p>
                </div>

                {/* Playback ID copy */}
                {isReady && (
                    <button
                        onClick={() => onCopyId(video.mux_playback_id)}
                        className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] text-white/40 font-mono hover:text-gold hover:border-gold/30 transition-colors"
                    >
                        <Copy className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{video.mux_playback_id}</span>
                    </button>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => onEdit(video)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-white/10 text-white/40 py-2 rounded-lg text-[9px] uppercase tracking-luxury font-bold hover:text-white hover:border-white/20 transition-colors"
                    >
                        <Edit3 className="w-3 h-3" />
                        Edit
                    </button>
                    {isReady && (
                        <a
                            href={`https://dashboard.mux.com/video/assets/${video.mux_asset_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 border border-white/10 text-white/40 px-3 py-2 rounded-lg text-[9px] hover:text-blue-400 hover:border-blue-400/30 transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                    <button
                        onClick={() => onDelete(video.id)}
                        className="flex items-center justify-center gap-1.5 border border-white/10 text-white/30 px-3 py-2 rounded-lg text-[9px] hover:text-red-400 hover:border-red-400/30 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
interface UploadZoneProps {
    onUploadComplete: (video: any) => void
}

function UploadZone({ onUploadComplete }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [title, setTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('video/')) {
            toast.error('Only video files are supported')
            return
        }

        setUploading(true)
        setProgress(0)

        try {
            // 1. Get Mux upload URL + pre-insert DB row
            const res = await fetch('/api/mux/create-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title || file.name }),
            })
            const { url, videoId, error } = await res.json()
            if (error) throw new Error(error)

            // 2. Upload directly to Mux via PUT
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
                }
                xhr.onload = () => resolve()
                xhr.onerror = () => reject(new Error('Upload failed'))
                xhr.open('PUT', url)
                xhr.send(file)
            })

            toast.success('🚀 Video uploaded to Mux! Processing will complete in ~1-2 min.')
            setTitle('')
            setProgress(0)

            // Return the pre-created video row for optimistic UI
            if (videoId) {
                onUploadComplete({
                    id: videoId,
                    title: title || file.name,
                    status: 'uploading',
                    thumbnail_url: null,
                    duration: null,
                    created_at: new Date().toISOString(),
                })
            }
        } catch (err: any) {
            toast.error(`Upload failed: ${err.message}`)
        } finally {
            setUploading(false)
        }
    }, [title, onUploadComplete])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    return (
        <div className="space-y-3">
            {/* Title input */}
            <input
                type="text"
                placeholder="Video title (optional)..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={uploading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold/30 transition-colors"
            />

            {/* Drop zone */}
            <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-gold bg-gold/5 scale-[0.99]' : 'border-white/10 hover:border-gold/30 bg-white/[0.02]'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-gold text-black scale-110' : 'bg-white/5 text-white/20'}`}>
                        {uploading
                            ? <Loader2 className="w-8 h-8 animate-spin" />
                            : <Film className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
                        }
                    </div>
                    <div>
                        <p className="text-base font-medium text-white/80">
                            {uploading ? `Uploading... ${progress}%` : isDragging ? 'Release to upload' : 'Drop video or click to browse'}
                        </p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                            MP4, MOV, WebM · Processed by Mux CDN · No size limit
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                {uploading && (
                    <div className="mt-4 mx-auto max-w-xs">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gold transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
    initialVideos: Video[]
}

export default function VideoManagerClient({ initialVideos }: Props) {
    const [videos, setVideos] = useState<Video[]>(initialVideos)
    const [editTarget, setEditTarget] = useState<Video | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const refresh = async () => {
        setRefreshing(true)
        try {
            const res = await fetch('/api/admin/videos')
            const data = await res.json()
            setVideos(data)
        } finally {
            setRefreshing(false)
        }
    }

    // Auto-refresh every 15s if any videos are processing/uploading
    useEffect(() => {
        const hasProcessing = videos.some(v => v.status === 'processing' || v.status === 'uploading')
        if (!hasProcessing) return
        const id = setInterval(refresh, 15_000)
        return () => clearInterval(id)
    }, [videos])

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this video from the library?')) return
        const res = await fetch(`/api/admin/videos?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setVideos(v => v.filter(x => x.id !== id))
            toast.success('Video removed')
        } else {
            toast.error('Delete failed')
        }
    }

    const handleSaveEdit = async (id: string, title: string, description: string) => {
        const res = await fetch('/api/admin/videos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, description }),
        })
        if (res.ok) {
            const updated = await res.json()
            setVideos(v => v.map(x => x.id === id ? updated : x))
            toast.success('Video updated')
        } else {
            toast.error('Update failed')
        }
    }

    const handleCopyId = (playbackId: string) => {
        navigator.clipboard.writeText(playbackId)
        toast.success('Playback ID copied')
    }

    const handleUploadComplete = (newVideo: Partial<Video>) => {
        setVideos(v => [newVideo as Video, ...v])
    }

    const readyCount = videos.filter(v => v.status === 'ready').length
    const processingCount = videos.filter(v => v.status === 'processing' || v.status === 'uploading').length

    return (
        <div className="space-y-10 pb-24 animate-luxury-fade">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Video Manager</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">
                        Mux CDN · Media Intelligence System
                    </p>
                </div>
                <button
                    onClick={refresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-[#121214] border border-white/10 px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-gold hover:border-gold/30 transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Videos', value: videos.length, color: 'text-white' },
                    { label: 'Ready', value: readyCount, color: 'text-emerald-400' },
                    { label: 'Processing', value: processingCount, color: 'text-amber-400' },
                    { label: 'Errored', value: videos.filter(v => v.status === 'errored').length, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-obsidian rounded-luxury shadow-luxury border border-luxury-border p-5">
                        <p className="text-[9px] uppercase tracking-luxury font-bold text-white/30 mb-2">{s.label}</p>
                        <p className={`text-3xl font-serif ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Upload Zone */}
            <div className="bg-obsidian border border-luxury-border rounded-luxury p-8">
                <h2 className="text-[11px] uppercase tracking-luxury font-bold text-gold mb-6">Upload New Video</h2>
                <UploadZone onUploadComplete={handleUploadComplete} />
            </div>

            {/* Video Grid */}
            {videos.length === 0 ? (
                <div className="py-32 text-center border border-dashed border-white/10 rounded-2xl">
                    <Film className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 text-[10px] uppercase tracking-widest">
                        No videos in the library. Upload your first video above.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map(video => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onDelete={handleDelete}
                            onEdit={setEditTarget}
                            onCopyId={handleCopyId}
                        />
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <EditModal
                    video={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    )
}
