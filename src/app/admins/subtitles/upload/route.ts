//Animaru\src\app\admins\subtitles\upload\route.ts

// src/app/api/admin/subtitles/upload/route.ts
import { NextResponse } from "next/server";
import { uploadSubtitleToMux } from "../../../../utils/uploadSubtitleToMux";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// env:
// NEXT_PUBLIC_SUPABASE_URL=...
// SUPABASE_SERVICE_ROLE_KEY=...   <-- required for server-side storage upload
// SUBTITLE_BUCKET=subtitles       <-- optional (defaults to "subtitles")
// SUBTITLE_PREFIX=                <-- optional (e.g. "shows/")

export async function POST(req: Request) {
  try {
    const {
      assetId,
      vttPath,
      languageCode = "en",
      name = "English CC",
    } = (await req.json()) as {
      assetId?: string;
      vttPath?: string;
      languageCode?: string;
      name?: string;
    };

    if (!assetId || !vttPath) {
      return NextResponse.json(
        { ok: false, error: "Missing assetId or vttPath" },
        { status: 400 }
      );
    }

    // Read local VTT file
    let fileBuf: Buffer;
    try {
      fileBuf = await fs.readFile(vttPath);
    } catch {
      return NextResponse.json(
        { ok: false, error: `VTT not found: ${vttPath}` },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env (URL or SERVICE ROLE KEY)" },
        { status: 500 }
      );
    }

    const BUCKET = process.env.SUBTITLE_BUCKET || "subtitles";
    const PREFIX = process.env.SUBTITLE_PREFIX || ""; // e.g. "animes/frieren/"

    // Use the service role to bypass RLS for server-side upload
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const baseName = path.basename(vttPath); // e.g. "frieren-dub-s1-e1.vtt"
    const objectKey = `${PREFIX}${baseName}`;

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectKey, fileBuf, {
        upsert: true,
        contentType: "text/vtt; charset=utf-8",
      });

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: `Supabase upload failed: ${upErr.message}` },
        { status: 500 }
      );
    }

    // Get a public URL (bucket should be Public)
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectKey);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json(
        { ok: false, error: "Failed to generate public URL for subtitle" },
        { status: 500 }
      );
    }

    // Tell Mux to fetch that URL and attach the subtitle track
    const track = await uploadSubtitleToMux(
      assetId,
      publicUrl,
      languageCode,
      name
    );

    return NextResponse.json({
      ok: true,
      track,
      storage: { bucket: BUCKET, key: objectKey, publicUrl },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
