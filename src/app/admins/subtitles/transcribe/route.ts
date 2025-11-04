//src/app/api/admin/subtitles/transcribe/route.ts

import { NextResponse } from "next/server";
import path from "path";
import { transcribeWhisperVTT } from "../../../../utils/transcribeWhisper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { wavPath, model, language, cli } = (await req.json()) as {
      wavPath?: string; model?: string; language?: string; cli?: "whisper" | "faster-whisper";
    };
    if (!wavPath || !model) {
      return NextResponse.json({ ok: false, error: "Missing wavPath or model" }, { status: 400 });
    }

    const vttPath = await transcribeWhisperVTT({ wavPath, model, language, cli });
    const fileName = path.basename(vttPath);
    return NextResponse.json({ ok: true, vttPath, fileName });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
