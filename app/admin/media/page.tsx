import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MediaLibraryClient from './MediaLibraryClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Media Library | Admin' }

export default async function MediaLibraryPage() {
    const supabase = await createClient()

    // List all files in the product-images bucket
    const { data: files, error } = await supabase.storage
        .from('product-images')
        .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })

    // Also list files from the 'products' subfolder (where ImageUpload uploads to)
    const { data: productFiles } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const bucketBase = `${supabaseUrl}/storage/v1/object/public/product-images`

    const rootFiles = (files ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .filter(f => f.metadata) // exclude folders
        .map(f => ({
            id: f.id ?? f.name,
            name: f.name,
            path: f.name,
            url: `${bucketBase}/${f.name}`,
            size: f.metadata?.size ?? 0,
            contentType: f.metadata?.mimetype ?? 'image/webp',
            createdAt: f.created_at ?? new Date().toISOString(),
        }))

    const prodFiles = (productFiles ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .filter(f => f.metadata)
        .map(f => ({
            id: f.id ?? `products/${f.name}`,
            name: f.name,
            path: `products/${f.name}`,
            url: `${bucketBase}/products/${f.name}`,
            size: f.metadata?.size ?? 0,
            contentType: f.metadata?.mimetype ?? 'image/webp',
            createdAt: f.created_at ?? new Date().toISOString(),
        }))

    const allFiles = [...prodFiles, ...rootFiles]

    // Fetch frontend_content for text/content blocks the admin can edit
    const { data: contentBlocks } = await supabase
        .from('frontend_content')
        .select('*')
        .order('content_key')

    return (
        <MediaLibraryClient
            initialFiles={allFiles}
            bucketBase={bucketBase}
            contentBlocks={contentBlocks ?? []}
        />
    )
}
