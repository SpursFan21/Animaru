//Animaru\src\app\api\admin\subtitles\transcribe\route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

type Body = {
  wavPath?: string;
  model?: "tiny" | "base" | "small" | "medium" | "large-v3";
  language?: string;
  cli?: "whisper" | "faster-whisper";
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function pickBin(cli: Body["cli"]) {
  if (cli === "faster-whisper") {
    // allow override if CLI name is different (e.g., faster-whisper-transcribe)
    return process.env.FASTER_WHISPER_BIN || "faster-whisper";
  }
  // default: openai/whisper CLI
  return process.env.WHISPER_BIN || "whisper";
}

async function run(bin: string, args: string[]) {
  const stderrChunks: string[] = [];
  const stdoutChunks: string[] = [];

  const exitCode: number = await new Promise((resolve) => {
    const p = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32", // important on Windows to resolve .cmd
      env: process.env,
    });

    p.stdout.on("data", (d) => stdoutChunks.push(d.toString()));
    p.stderr.on("data", (d) => stderrChunks.push(d.toString()));
    p.on("error", (err) => {
      stderrChunks.push(String(err?.message || err));
      resolve(127);
    });
    p.on("close", (code) => resolve(code ?? 1));
  });

  return {
    code: exitCode,
    stdout: stdoutChunks.join(""),
    stderr: stderrChunks.join(""),
  };
}

export async function POST(req: Request) {
  try {
    const { wavPath, model = "small", language, cli = "whisper" } =
      (await req.json()) as Body;

    if (!wavPath) {
      return NextResponse.json({ ok: false, error: "Missing wavPath" }, { status: 400 });
    }
    if (!fs.existsSync(wavPath)) {
      return NextResponse.json({ ok: false, error: "WAV not found on server" }, { status: 400 });
    }

    // /media/subtitles beside /media/videos and /media/audio
    const cwd = process.cwd();
    const mediaRoot = fs.existsSync(path.join(cwd, "media"))
      ? path.join(cwd, "media")
      : path.join(cwd, "src", "media"); // fallback if running inside src
    const outDir = path.join(mediaRoot, "subtitles");
    ensureDir(outDir);

    const base = path.basename(wavPath).replace(/\.wav$/i, "");
    const vttPath = path.join(outDir, `${base}.vtt`);

    const bin = pickBin(cli);
    let args: string[] = [];

    if (cli === "faster-whisper") {
      // Typical flags; install may vary
      args = [
        wavPath,
        "--model", model,
        "--output_format", "vtt",
        "--output_dir", outDir,
        "--vad_filter", "True",
      ];
      if (language && language.trim()) {
        args.push("--language", language.trim());
      }
    } else {
      // openai/whisper
      args = [
        wavPath,
        "--model", model,
        "--task", "transcribe",
        "--output_format", "vtt",
        "--output_dir", outDir,
      ];
      if (language && language.trim()) {
        args.push("--language", language.trim());
      }
    }

    const { code, stderr, stdout } = await run(bin, args);

    if (code !== 0) {
      // surface the real reason in the response (trim to keep payload reasonable)
      return NextResponse.json(
        {
          ok: false,
          error: `Transcribe failed (exit ${code}).\n---stderr---\n${stderr.slice(0, 4000)}\n---stdout---\n${stdout.slice(0, 2000)}`,
        },
        { status: 500 }
      );
    }

    // CLI may create slightly different filenames; try to detect
    if (!fs.existsSync(vttPath)) {
      const maybe = fs
        .readdirSync(outDir)
        .find((f) => f.toLowerCase().endsWith(".vtt") && f.startsWith(base));
      if (maybe) {
        return NextResponse.json({ ok: true, vttPath: path.join(outDir, maybe) });
      }
      return NextResponse.json({ ok: false, error: "VTT not created" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, vttPath });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
