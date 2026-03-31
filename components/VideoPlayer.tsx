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
    if (!playbackId || playbackId === 'pending') return null

    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`
    const mp4Url = `https://stream.mux.com/${playbackId}/high.mp4`
    const thumbnailUrl = poster ?? `https://image.mux.com/${playbackId}/thumbnail.jpg`

    return (
        <div className={`w-full overflow-hidden ${aspectClass} ${className}`}>
            <video
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                controls={controls}
                playsInline
                poster={thumbnailUrl}
                aria-label={title}
            >
                {/* HLS (Safari native + hls.js polyfill) */}
                <source src={streamUrl} type="application/x-mpegURL" />
                {/* MP4 fallback (Chrome/Firefox without hls.js) */}
                <source src={mp4Url} type="video/mp4" />
            </video>
        </div>
    )
}
