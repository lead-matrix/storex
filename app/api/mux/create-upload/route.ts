import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // ── Auth Guard ─────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // ───────────────────────────────────────────────────────

  try {
    const body = await req.json().catch(() => ({}));
    const title = body?.title || null;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "standard",
      },
      cors_origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
    });

    const { data: video } = await supabaseAdmin
      .from("videos")
      .insert({
        mux_upload_id: upload.id,
        mux_asset_id: "pending",
        mux_playback_id: "pending",
        title: title,
        status: "uploading",
      })
      .select("id")
      .single();

    return NextResponse.json({
      url: upload.url,
      uploadId: upload.id,
      videoId: video?.id,
    });
  } catch (err: any) {
    console.error("[Mux] create-upload error:", err);
    const msg = err.message || "";
    if (msg.includes("401") || msg.includes("unauthorized")) {
       return NextResponse.json({ error: "Mux Authentication failed. Please verify MUX_TOKEN_ID and MUX_TOKEN_SECRET in your Vercel Environment Variables. Confirm you are using Video API tokens." }, { status: 500 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
