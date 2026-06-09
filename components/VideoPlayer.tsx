'use client'

/**
 * VideoPlayer
 * Uses the official @mux/mux-player-react web component which handles:
 * - HLS streaming natively (no manual Hls.js wiring needed)
 * - Autoplay with muted, loop and playsInline
 * - blob: URL media sources (bypasses CSP issues with manual Hls.js)
 * - Cross-browser compatibility (Safari, Chrome, Firefox, Edge)
 */
import MuxPlayer from '@mux/mux-player-react'

interface VideoPlayerProps {
    playbackId: string
    title?: string
    autoPlay?: boolean
    muted?: boolean
    loop?: boolean
    controls?: boolean
    className?: string
    /** Aspect ratio class e.g. "aspect-video" or "aspect-[9/16]" */
    aspectClass?: string
}

export default function VideoPlayer({
    playbackId,
    title,
    autoPlay = false,
    muted = false,
    loop = false,
    controls = false,
    className = '',
    aspectClass = 'aspect-video',
}: VideoPlayerProps) {
    if (!playbackId || playbackId === 'pending') return null

    const isMuted = autoPlay || muted
    const isLooping = autoPlay || loop

    return (
        <div className={`w-full overflow-hidden bg-black ${aspectClass} ${className}`}>
            <MuxPlayer
                playbackId={playbackId}
                streamType="on-demand"
                autoPlay={autoPlay ? 'muted' : false}
                muted={isMuted}
                loop={isLooping}
                playsInline
                metadata={{ video_title: title }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={{
                    width: '100%',
                    height: '100%',
                    ...(!controls ? { '--controls': 'none' } : {}),
                } as any}
            />
        </div>
    )
}
