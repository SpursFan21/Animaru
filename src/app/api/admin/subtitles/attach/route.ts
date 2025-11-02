//Animaru\src\app\api\admin\subtitles\attach\route.ts

// src/app/api/admin/subtitles/attach/route.ts
import { NextResponse } from "next/server";
import { uploadSubtitleToMux } from "../../../../../utils/uploadSubtitleToMux";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { assetId, bucketKey, languageCode = "en", name = "English CC" } =
      (await req.json()) as {
        assetId?: string;
        bucketKey?: string; // e.g. "folder/file.vtt"
        languageCode?: string;
        name?: string;
      };

    if (!assetId || !bucketKey) {
      return NextResponse.json({ ok: false, error: "Missing assetId or bucketKey" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUBTITLE_BUCKET || "subtitles";
    if (!url || !svc) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
    }

    const supabase = createClient(url, svc, { auth: { persistSession: false } });
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(bucketKey);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ ok: false, error: "Could not resolve public URL" }, { status: 500 });
    }

    const track = await uploadSubtitleToMux(assetId, publicUrl, languageCode, name);
    return NextResponse.json({ ok: true, track, publicUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
