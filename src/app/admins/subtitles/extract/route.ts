//src/app/api/admin/subtitles/extract/route.ts

import { NextResponse } from "next/server";
import { extractAudioOne } from "@/utils/extractAudio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name } = (await req.json()) as { name?: string };
    if (!name) return NextResponse.json({ ok: false, error: "Missing name" }, { status: 400 });
    const wavPath = await extractAudioOne(name);
    return NextResponse.json({ ok: true, wavPath });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
