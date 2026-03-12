import { createClient } from "@/lib/supabase/server"
import CMSRenderer from "@/components/cms/CMSRenderer"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface Props {
    params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = params
    const supabase = await createClient()
    const { data: page } = await supabase
        .from("cms_pages")
        .select("title")
        .eq("slug", slug)
        .eq("is_published", true)
        .single()

    if (!page) return { title: "Page Not Found | DINA COSMETIC" }
    return { title: `${page.title} | DINA COSMETIC` }
}

export default async function CMSPage({ params }: Props) {
    const supabase = await createClient()

    const { data: page } = await supabase
        .from("cms_pages")
        .select(`
            *,
            cms_sections(*)
        `)
        .eq("slug", params.slug)
        .eq("is_published", true)
        .order("sort_order", { foreignTable: "cms_sections", ascending: true })
        .single()

    if (!page) notFound()

    const sections = (page.cms_sections ?? [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((s: { type: string; props: Record<string, unknown> }) => ({ type: s.type, props: s.props }))

    return (
        <main className="min-h-screen bg-obsidian">
            <CMSRenderer sections={sections} />
        </main>
    )
}
