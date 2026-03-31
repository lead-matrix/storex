import { createClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import VideoManagerClient from '@/components/admin/VideoManagerClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Video Manager | Admin — DINA COSMETIC' }

export default async function VideoManagerPage() {
    const supabase = await createClient()

    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[Admin Video Manager] fetch error:', error)
    }

    return <VideoManagerClient initialVideos={videos ?? []} />
}
