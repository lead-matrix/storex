"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Validates that the current user is an admin.
 * Uses the server-side supabase client.
 */
export async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Authentication required");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }

    return supabase;
}

/**
 * Server actions exposed for client components
 */

export async function createPage(title: string, slug: string) {
    const supabase = await ensureAdmin();

    const cleanSlug = slug.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
        .from("cms_pages")
        .insert([{ title, slug: cleanSlug }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath("/admin/cms");
    return data;
}

export async function saveSections(pageId: string, sections: any[]) {
    const supabase = await ensureAdmin();

    const { error: delError } = await supabase.from("cms_sections").delete().eq("page_id", pageId);
    if (delError) throw new Error(delError.message);

    if (sections.length > 0) {
        const inserts = sections.map((s, idx) => ({
            page_id: pageId,
            type: s.type,
            sort_order: idx,
            props: s.props || {}
        }));
        const { error } = await supabase.from("cms_sections").insert(inserts);
        if (error) throw new Error(error.message);
    }

    revalidatePath(`/admin/cms/${pageId}`);
    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/collections");
    revalidatePath("/privacy");
    revalidatePath("/terms");
    revalidatePath("/sale");
    revalidatePath("/[slug]", "page");
}
