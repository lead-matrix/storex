import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RenderBlock } from '@/lib/builder/BlockRegistry'
import type { PageBlock } from '@/lib/builder/types'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    return {
        title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | DINA COSMETIC`,
    }
}

export default async function PublicBuilderPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: page } = await supabase
        .from('builder_pages')
        .select('id, slug, title, blocks, published')
        .eq('slug', slug)
        .eq('published', true)
        .single()

    if (!page) notFound()

    const blocks = (page.blocks ?? []) as PageBlock[]

    return (
        <main className="bg-black min-h-screen pt-20">
            {blocks.map((block: PageBlock) => (
                <RenderBlock key={block.id} block={block} />
            ))}
            {blocks.length === 0 && (
                <div className="flex items-center justify-center h-96 text-white/20 text-xs uppercase tracking-widest">
                    This page has no content yet.
                </div>
            )}
        </main>
    )
}
