import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CMSRenderer from "@/components/cms/CMSRenderer";

export const dynamic = "force-dynamic";

export default async function CMSPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient();

    // Fetch published page and its sections
    const { data: page } = await supabase
        .from("cms_pages")
        .select(`
            *,
            cms_sections(*)
        `)
        .eq("slug", params.slug)
        .eq("is_published", true)
        .order("sort_order", { foreignTable: "cms_sections", ascending: true })
        .single();

    if (!page) notFound();

    return (
        <main className="min-h-screen bg-obsidian">
            <CMSRenderer sections={page.cms_sections || []} />
        </main>
    );
}

// Optional: Generate static params if performance is critical
// For this luxury experience, we stick to dynamic fetching for real-time updates.
