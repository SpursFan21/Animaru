//Animaru\src\app\api\admin\subtitles\transcribe\route.ts

// src/app/api/admin/subtitles/transcribe/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" }); // stream to server console
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

export async function POST(req: Request) {
  try {
    const { wavPath, model, language, cli } = (await req.json()) as {
      wavPath?: string;
      model?: "tiny" | "base" | "small" | "medium" | "large-v3";
      language?: string | undefined;
      cli?: "whisper" | "faster-whisper";
    };

    if (!wavPath) {
      return NextResponse.json({ ok: false, error: "Missing wavPath" }, { status: 400 });
    }
    if (!fs.existsSync(wavPath)) {
      return NextResponse.json({ ok: false, error: "WAV not found" }, { status: 400 });
    }

    // Output folder for subtitles
    const outDir = path.join(process.cwd(), "media", "subtitles");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const base = path.basename(wavPath).replace(/\.[^.]+$/i, "");
    const vttPath = path.join(outDir, `${base}.vtt`);

    const chosenCli = cli ?? "whisper";
    if (chosenCli === "whisper") {
      // OpenAI whisper CLI
      // whisper <input> --model <model> --task transcribe --output_format vtt --output_dir <outDir> [--language xx]
      const args = [
        wavPath,
        "--model",
        model ?? "small",
        "--task",
        "transcribe",
        "--output_format",
        "vtt",
        "--output_dir",
        outDir,
      ];
      if (language && language.trim()) args.push("--language", language.trim());
      await run("whisper", args);
    } else {
      // faster-whisper CLI
      // faster-whisper --model <model> --output_dir <outDir> --output_format vtt [--language xx] <input>
      const args = ["--model", model ?? "small", "--output_dir", outDir, "--output_format", "vtt"];
      if (language && language.trim()) args.push("--language", language.trim());
      args.push(wavPath);
      await run("faster-whisper", args);
    }

    if (!fs.existsSync(vttPath)) {
      return NextResponse.json({ ok: false, error: "VTT was not produced" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vttPath });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
