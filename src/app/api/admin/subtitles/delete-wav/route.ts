//Animaru\src\app\api\admin\subtitles\delete-wav\route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function safeUnlink(p: string) {
  try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
}

export async function POST(req: Request) {
  try {
    const { wavPath, mp4Name } = (await req.json()) as { wavPath?: string; mp4Name?: string };

    if (!wavPath && !mp4Name) {
      return NextResponse.json({ ok: false, error: "Provide wavPath or mp4Name" }, { status: 400 });
    }

    let target = wavPath;
    if (!target && mp4Name) {
      if (!/^[\w\-. ()]+\.mp4$/i.test(mp4Name)) {
        return NextResponse.json({ ok: false, error: "Invalid filename" }, { status: 400 });
      }
      const cwd = process.cwd();
      const audioDir = path.join(cwd, "media", "audio");
      target = path.join(audioDir, mp4Name.replace(/\.mp4$/i, ".wav"));
    }

    if (!target) {
      return NextResponse.json({ ok: false, error: "Could not resolve WAV path" }, { status: 400 });
    }
    safeUnlink(target);
    return NextResponse.json({ ok: true, deleted: target });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
