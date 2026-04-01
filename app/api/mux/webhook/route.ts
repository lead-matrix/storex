import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "not_set",
  tokenSecret: process.env.MUX_TOKEN_SECRET || "not_set",
});

/**
 * Mux Webhook handler.
 * Now optionally supports verify-signature integration via MUX_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const muxSignature = req.headers.get("mux-signature");
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    let body;

    if (webhookSecret && muxSignature) {
      try {
        body = mux.webhooks.unwrap(rawBody, req.headers, webhookSecret);
      } catch (err: any) {
        console.error("[Mux Webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      body = JSON.parse(rawBody);
    }

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
