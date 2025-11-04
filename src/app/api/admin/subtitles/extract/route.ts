//Animaru\src\app\api\admin\subtitles\extract\route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { extractAudioOne } from "../../../../../utils/extractAudio";

export async function POST(req: Request) {
  try {
    const { name } = (await req.json()) as { name?: string };
    if (!name) {
      return NextResponse.json({ ok: false, error: "Missing file name" }, { status: 400 });
    }

    // Basic safety: only allow .mp4 names, no path traversal
    if (!/^[\w\-. ()]+\.mp4$/i.test(name)) {
      return NextResponse.json({ ok: false, error: "Invalid filename" }, { status: 400 });
    }

    const wavPath = await extractAudioOne(name);

    // sanity check that the file exists
    if (!fs.existsSync(wavPath)) {
      return NextResponse.json({ ok: false, error: "WAV not generated" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, wavPath });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
