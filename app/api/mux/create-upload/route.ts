import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createClient } from "@supabase/supabase-js";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/mux/create-upload
 * Creates a Mux Direct Upload and pre-inserts a video row in the DB
 * so the admin can track upload progress from the media manager.
 * Body: { title?: string }
 */
export async function POST(req: Request) {
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

    // Pre-insert video row with upload_id so webhook can link the asset
    const { data: video } = await supabase
      .from("videos")
      .insert({
        mux_upload_id: upload.id,
        mux_asset_id: "pending",       // Mux webhook will update this
        mux_playback_id: "pending",    // Mux webhook will update this
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
