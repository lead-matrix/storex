import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    // ── Auth Guard ─────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // ───────────────────────────────────────────────────────

    try {
        const body = await req.json();
        const { slug, title, status, content } = body;

        if (!slug || !title || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const is_published = status === 'published';

        const payload = {
            slug,
            title,
            is_published,
            content,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from("pages")
            .upsert(payload, { onConflict: "slug" })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
