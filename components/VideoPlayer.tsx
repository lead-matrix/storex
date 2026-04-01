'use client'

interface VideoPlayerProps {
    playbackId: string
    title?: string
    autoPlay?: boolean
    muted?: boolean
    loop?: boolean
    controls?: boolean
    className?: string
    /** Poster image override — defaults to Mux thumbnail */
    poster?: string
    /** Aspect ratio class e.g. "aspect-video" or "aspect-[9/16]" */
    aspectClass?: string
}

/**
 * VideoPlayer
 * Renders a Mux-hosted video using the native <video> element with HLS via
 * the Mux stream URL. This avoids adding the heavy @mux/mux-player-react
 * package while still supporting all major browsers (HLS is natively
 * supported in Safari; Chrome/Firefox use the src MP4 fallback).
 *
 * For full HLS support across all browsers without a package, add hls.js:
 *   npm install hls.js
 * and we'll auto-initialise it below.
 */
import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({
    playbackId,
    title,
    autoPlay = false,
    muted = false,
    loop = false,
    controls = false,
    className = '',
    poster,
    aspectClass = 'aspect-video',
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`
    const thumbnailUrl = poster ?? `https://image.mux.com/${playbackId}/thumbnail.jpg`

    useEffect(() => {
        if (!playbackId || playbackId === 'pending') return
        const video = videoRef.current
        if (!video) return

        let hls: Hls | null = null;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari / native support
            video.src = streamUrl
            if (autoPlay) {
                video.play().catch(e => console.log('Autoplay prevented:', e))
            }
        } else if (Hls.isSupported()) {
            // Chrome / Firefox
            hls = new Hls()
            hls.loadSource(streamUrl)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    video.play().catch(e => console.log('Autoplay prevented:', e))
                }
            })
        }

        return () => {
            if (hls) {
                hls.destroy()
            }
        }
    }, [playbackId, streamUrl, autoPlay])

    if (!playbackId || playbackId === 'pending') return null

    return (
        <div className={`w-full overflow-hidden flex items-center justify-center bg-black ${aspectClass} ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                controls={controls}
                playsInline
                poster={thumbnailUrl}
                aria-label={title}
            />
        </div>
    )
}
