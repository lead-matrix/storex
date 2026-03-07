'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PageBlock } from '@/lib/builder/types'

interface SavePageArgs {
    id: string
    slug: string
    title: string
    blocks: PageBlock[]
    published: boolean
}

export async function savePage(args: SavePageArgs): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
        .from('builder_pages')
        .upsert({
            id: args.id,
            slug: args.slug,
            title: args.title,
            blocks: args.blocks,
            published: args.published,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/pages/${args.slug}`)
    revalidatePath('/admin/builder')
    return { success: true }
}

export async function listPages(): Promise<{ id: string; slug: string; title: string; published: boolean; updated_at: string }[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('builder_pages')
        .select('id, slug, title, published, updated_at')
        .order('updated_at', { ascending: false })
    return data ?? []
}

export async function createNewPage(): Promise<{ id: string }> {
    const supabase = await createClient()
    const id = crypto.randomUUID()
    await supabase.from('builder_pages').insert({
        id,
        slug: `page-${id.slice(0, 6)}`,
        title: 'New Page',
        blocks: [],
        published: false,
    })
    revalidatePath('/admin/builder')
    return { id }
}

export async function deletePage(id: string): Promise<void> {
    const supabase = await createClient()
    await supabase.from('builder_pages').delete().eq('id', id)
    revalidatePath('/admin/builder')
}
