//Animaru\src\app\api\admin\subtitles\attach\route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadSubtitleToMux } from "../../../../../utils/uploadSubtitleToMux";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { assetId, bucketKey, languageCode = "en", name = "English CC" } =
      (await req.json()) as {
        assetId?: string;
        bucketKey?: string; // "sb:<key>" or "local:<filename>"
        languageCode?: string;
        name?: string;
      };

    if (!assetId || !bucketKey) {
      return NextResponse.json({ ok: false, error: "Missing assetId or bucketKey" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUBTITLE_BUCKET || "subtitles";
    const prefix = process.env.SUBTITLE_PREFIX || "";

    if (!url || !svc) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
    }

    const supabase = createClient(url, svc, { auth: { persistSession: false } });

    let publicUrl: string | null = null;

    if (bucketKey.startsWith("sb:")) {
      // Supabase file already there
      const key = bucketKey.slice(3);
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
      publicUrl = pub?.publicUrl ?? null;
      if (!publicUrl) {
        return NextResponse.json({ ok: false, error: "Could not resolve public URL" }, { status: 500 });
      }
    } else if (bucketKey.startsWith("local:")) {
      // Upload local file to Supabase, then get public URL
      const filename = bucketKey.slice(6);
      const localDir =
        process.env.SUBTITLE_LOCAL_DIR
          ? path.isAbsolute(process.env.SUBTITLE_LOCAL_DIR)
            ? process.env.SUBTITLE_LOCAL_DIR
            : path.join(process.cwd(), process.env.SUBTITLE_LOCAL_DIR)
          : path.join(process.cwd(), "media", "subtitles");
      const abs = path.join(localDir, filename);
      if (!fs.existsSync(abs)) {
        return NextResponse.json({ ok: false, error: "Local VTT not found" }, { status: 400 });
      }
      const buf = fs.readFileSync(abs);
      const targetKey = `${prefix}${filename}`;
      // upsert so you can re-attach
      const { error: upErr } = await supabase
        .storage
        .from(bucket)
        .upload(targetKey, buf, { contentType: "text/vtt", upsert: true });
      if (upErr) {
        return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
      }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(targetKey);
      publicUrl = pub?.publicUrl ?? null;
      if (!publicUrl) {
        return NextResponse.json({ ok: false, error: "Could not resolve public URL after upload" }, { status: 500 });
      }
    } else {
      // Backward compatibility: treat as raw Supabase key
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(bucketKey);
      publicUrl = pub?.publicUrl ?? null;
      if (!publicUrl) {
        return NextResponse.json({ ok: false, error: "Could not resolve public URL" }, { status: 500 });
      }
    }

    const track = await uploadSubtitleToMux(assetId, publicUrl, languageCode, name);
    return NextResponse.json({ ok: true, track, publicUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
