"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import { createClient as createAdminClient } from "@/lib/supabase/admin"
/**
 * CMS PAGE ACTIONS
 */

export async function createPage(title: string, slug: string) {
    await requireAdmin();
    const supabase = await createAdminClient();

    // Standardize slug
    const cleanSlug = slug.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
        .from("cms_pages")
        .insert([{ title, slug: cleanSlug }])
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath("/admin/cms")
    return data
}

export async function togglePagePublish(pageId: string, currentStatus: boolean) {
    await requireAdmin();
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("cms_pages")
        .update({ is_published: !currentStatus })
        .eq("id", pageId)

    if (error) throw new Error(error.message)
    revalidatePath("/admin/cms")
    revalidatePath("/")
    revalidatePath("/[slug]", "page")
}

export async function deletePage(pageId: string) {
    await requireAdmin();
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("cms_pages")
        .delete()
        .eq("id", pageId)

    if (error) throw new Error(error.message)
    revalidatePath("/admin/cms")
}

/**
 * CMS SECTION ACTIONS
 */

export async function saveSections(pageId: string, sections: any[]) {
    await requireAdmin();
    const supabase = await createAdminClient();

    // In a production environment, we use a delete-then-insert strategy 
    // or a sophisticated upsert to handle reordering and deletions.
    const { error: delError } = await supabase.from("cms_sections").delete().eq("page_id", pageId)
    if (delError) throw new Error(delError.message)

    if (sections.length > 0) {
        const inserts = sections.map((s, idx) => ({
            page_id: pageId,
            type: s.type,
            sort_order: idx,
            props: s.props || {}
        }))
        const { error } = await supabase.from("cms_sections").insert(inserts)
        if (error) throw new Error(error.message)
    }

    revalidatePath(`/admin/cms/${pageId}`)
    revalidatePath("/", "layout")
    revalidatePath("/about")
    revalidatePath("/contact")
    revalidatePath("/collections")
    revalidatePath("/privacy")
    revalidatePath("/terms")
    revalidatePath("/sale")
    revalidatePath("/[slug]", "page")
}
