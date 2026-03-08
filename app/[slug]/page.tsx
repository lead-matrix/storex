import { createClient } from "@/lib/supabase/server"
import PageRenderer from "@/components/PageRenderer"
import { notFound } from "next/navigation"

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: page } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .single()

    if (!page) {
        return notFound()
    }

    return (
        <main className="min-h-screen">
            <PageRenderer blocks={page.content} />
        </main>
    )
}
