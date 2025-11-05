//Animaru\src\app\api\admin\subtitles\status\route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function pickExistingPath(paths: string[]) {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

export async function POST(req: Request) {
  try {
    const { name } = (await req.json()) as { name?: string }; // MP4 file name only
    if (!name || !/^[\w\-. ()]+\.mp4$/i.test(name)) {
      return NextResponse.json({ ok: false, error: "Invalid filename" }, { status: 400 });
    }

    const cwd = process.cwd();
    const videoDir =
      pickExistingPath([path.join(cwd, "media", "videos"), path.join(cwd, "src", "media", "videos")]) ||
      path.join(cwd, "media", "videos");

    const audioDir = path.join(path.dirname(videoDir), "audio");
    const subDir   = path.join(path.dirname(videoDir), "subtitles");

    const base = name.replace(/\.mp4$/i, "");
    const wavPath = path.join(audioDir, `${base}.wav`);
    const vttPath = path.join(subDir,  `${base}.vtt`);

    return NextResponse.json({
      ok: true,
      wav: fs.existsSync(wavPath) ? wavPath : null,
      vtt: fs.existsSync(vttPath) ? vttPath : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
