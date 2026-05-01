import { createClient } from "@/lib/supabase/server"
import { RenderBlock } from "@/lib/builder/BlockRegistry"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { PageBlock } from "@/lib/builder/types"

export const dynamic = "force-dynamic"

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()
    const { data: page } = await supabase
        .from("builder_pages")
        .select("title")
        .eq("slug", slug)
        .eq("published", true)
        .single()

    if (!page) return { title: "Page Not Found | DINA COSMETIC" }
    return { title: `${page.title} | DINA COSMETIC` }
}

export default async function BuilderPublicPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: page } = await supabase
        .from("builder_pages")
        .select("id, slug, title, blocks, published")
        .eq("slug", slug)
        .eq("published", true)
        .single()

    if (!page) notFound()

    const blocks: PageBlock[] = Array.isArray(page.blocks) ? page.blocks : []

    return (
        <main className="min-h-screen bg-black">
            {blocks.map((block: PageBlock) => (
                <RenderBlock key={block.id} block={block} />
            ))}
        </main>
    )
}
