import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Uses service role to bypass RLS for admin operations.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { slug, title, status, content } = body

        if (!slug || !title || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Try to map status to is_published to avoid conflicts with existing MASTER.sql table `pages`
        const is_published = status === 'published'

        const payload = {
            slug,
            title,
            is_published, // Map to existing schema
            content,
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from("pages")
            .upsert(payload, { onConflict: "slug" })
            .select()
            .single()

        if (error) {
            console.error("Supabase error saving page:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Error in POST /api/admin/pages:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
