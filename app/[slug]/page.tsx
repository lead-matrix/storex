import PageRenderer from "@/components/PageRenderer"
import { fetchPage } from "@/lib/fetchPage"
import { notFound } from "next/navigation"

export const revalidate = 60 // Revalidate page every 60 seconds

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const page = await fetchPage(slug)

    if (!page) {
        notFound()
    }

    // Ensure content.sections exists correctly depending on how we saved the JSON data
    let sections = []

    if (page.content && Array.isArray((page.content as any).sections)) {
        sections = (page.content as any).sections
    } else if (Array.isArray(page.content)) {
        sections = page.content as any
    }

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 pt-20">
            <PageRenderer sections={sections} />
        </main>
    )
}
