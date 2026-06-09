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

    const isMuted = autoPlay || muted
    const isLooping = autoPlay || loop

    // Callback ref to guarantee muted state programmatically as soon as DOM node is created,
    // bypassing any React muted hydration/re-render bugs.
    const setVideoRef = (el: HTMLVideoElement | null) => {
        (videoRef as any).current = el
        if (el) {
            if (isMuted) {
                el.defaultMuted = true
                el.muted = true
            }
        }
    }

    useEffect(() => {
        if (!playbackId || playbackId === 'pending') return
        const video = videoRef.current
        if (!video) return

        let hls: Hls | null = null;

        // Force muted properties programmatically to satisfy browser autoplay policy
        if (isMuted) {
            video.defaultMuted = true
            video.muted = true
        }

        const startPlayback = () => {
            if (autoPlay) {
                video.play().catch((e) => {
                    console.log('Autoplay execution failed/prevented:', e)
                })
            }
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari / native support
            video.src = streamUrl
            video.addEventListener('loadedmetadata', startPlayback)
            video.addEventListener('canplay', startPlayback)
            startPlayback()
        } else if (Hls.isSupported()) {
            // Chrome / Firefox
            hls = new Hls({
                maxMaxBufferLength: 10,
            })
            hls.loadSource(streamUrl)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, startPlayback)
            video.addEventListener('canplay', startPlayback)
        }

        // Safety fallback: force play after 1s in case browser blocked initial calls
        const timeoutId = setTimeout(startPlayback, 1000)

        return () => {
            if (hls) {
                hls.destroy()
            }
            video.removeEventListener('loadedmetadata', startPlayback)
            video.removeEventListener('canplay', startPlayback)
            clearTimeout(timeoutId)
        }
    }, [playbackId, streamUrl, autoPlay, isMuted])

    if (!playbackId || playbackId === 'pending') return null

    return (
        <div className={`w-full overflow-hidden flex items-center justify-center bg-black ${aspectClass} ${className}`}>
            <video
                ref={setVideoRef}
                className="w-full h-full object-contain"
                autoPlay={autoPlay}
                muted={isMuted}
                loop={isLooping}
                controls={controls}
                playsInline
                poster={thumbnailUrl}
                aria-label={title}
            />
        </div>
    )
}
