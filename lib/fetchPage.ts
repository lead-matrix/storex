import { supabase } from "./supabase"

export interface PageContent {
    sections: Array<{
        type: string;
        [key: string]: any;
    }>
}

export interface PageData {
    id: string;
    slug: string;
    title: string;
    status?: string;
    is_published?: boolean;
    content: PageContent;
    created_at?: string;
}

export async function fetchPage(slug: string): Promise<PageData | null> {
    const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .single()

    if (error) {
        console.error("Error fetching page:", error)
        return null
    }

    return data as PageData
}
