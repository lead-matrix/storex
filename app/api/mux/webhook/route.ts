import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Mux Webhook handler.
 * Listens for video lifecycle events:
 *   - video.upload.asset_created  → insert row with mux_upload_id for tracking
 *   - video.asset.created         → row created, still processing
 *   - video.asset.ready           → asset playback is live, update status + metadata
 *   - video.asset.errored         → mark as errored so admin can retry
 *
 * We do NOT verify the Mux webhook signature here for simplicity; in production,
 * you can add Mux webhook signature verification using the mux-node SDK.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body.type as string;
    const data = body.data as any;

    console.log(`[Mux Webhook] Event: ${type}`, { assetId: data?.id });

    if (type === "video.upload.asset_created") {
      // Upload has been received by Mux, asset creation started
      const uploadId = body.object?.id || data?.upload_id;
      const assetId = data?.asset_id || data?.id;

      if (assetId && uploadId) {
        // Update the row that was pre-inserted by the admin UI via upload ID
        const { error } = await supabase
          .from("videos")
          .update({ mux_asset_id: assetId, status: "processing" })
          .eq("mux_upload_id", uploadId);

        if (error) console.error("[Mux Webhook] upload.asset_created update error:", error);
      }
    }

    if (type === "video.asset.created") {
      // Asset record created in Mux — may not have playback_id yet
      const playbackId = data?.playback_ids?.[0]?.id ?? null;
      const uploadId = data?.upload_id ?? null;

      // Try to upsert by mux_asset_id in case a row already exists from upload phase
      const { error } = await supabase
        .from("videos")
        .upsert(
          {
            mux_asset_id: data.id,
            mux_playback_id: playbackId ?? "",
            mux_upload_id: uploadId,
            status: "processing",
            thumbnail_url: playbackId
              ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
              : null,
          },
          { onConflict: "mux_asset_id" }
        );

      if (error) console.error("[Mux Webhook] asset.created upsert error:", error);
    }

    if (type === "video.asset.ready") {
      // Asset is live — update status, playback_id, and metadata
      const playbackId = data?.playback_ids?.[0]?.id ?? null;

      const { error } = await supabase
        .from("videos")
        .update({
          status: "ready",
          mux_playback_id: playbackId ?? "",
          thumbnail_url: playbackId
            ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
            : null,
          duration: data?.duration ?? null,
          aspect_ratio: data?.aspect_ratio ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("mux_asset_id", data.id);

      if (error) console.error("[Mux Webhook] asset.ready update error:", error);
      else console.log(`[Mux Webhook] Asset ready: ${data.id} (playback: ${playbackId})`);
    }

    if (type === "video.asset.errored") {
      const { error } = await supabase
        .from("videos")
        .update({ status: "errored", updated_at: new Date().toISOString() })
        .eq("mux_asset_id", data.id);

      if (error) console.error("[Mux Webhook] asset.errored update error:", error);
      else console.error(`[Mux Webhook] Asset ERRORED: ${data.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Mux Webhook] Unhandled error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
