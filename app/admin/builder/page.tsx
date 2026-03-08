import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import BuilderHub from './BuilderHub'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Page Builder | Admin' }

export default async function BuilderPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams
    const pageId = params?.page

    // Fetch all pages for the hub
    const { data: pages } = await supabase
        .from('builder_pages')
        .select('id, slug, title, published, updated_at, blocks')
        .order('updated_at', { ascending: false })

    // If a page ID is provided, open editor directly
    if (pageId) {
        const page = (pages ?? []).find(p => p.id === pageId)
        if (!page) redirect('/admin/builder')

        // Dynamic import to keep server component boundary clean
        const BuilderCanvas = (await import('./BuilderCanvas')).default
        return (
            <BuilderCanvas
                pageId={page.id}
                slug={page.slug}
                title={page.title}
                initialBlocks={page.blocks ?? []}
                published={page.published ?? false}
            />
        )
    }

    return <BuilderHub pages={pages ?? []} />
}
