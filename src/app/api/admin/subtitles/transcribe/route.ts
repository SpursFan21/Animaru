//Animaru\src\app\api\admin\subtitles\transcribe\route.ts

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

type RunResult = { code: number; stdout: string; stderr: string };

function runAndCapture(cmd: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    p.on("error", (err) =>
      resolve({ code: 1, stdout, stderr: (err as Error).message })
    );
  });
}

/** Prefer <base>.vtt, but fall back to <base>.*.vtt (e.g., <base>.en.vtt).
 *  Also handles tools that normalize spaces to underscores in the output filename.
 */
function findVtt(outDir: string, base: string): string | null {
  // Exact match first
  const exact = path.join(outDir, `${base}.vtt`);
  if (fs.existsSync(exact)) return exact;

  const baseLower = base.toLowerCase();
  const baseUnderscore = baseLower.replace(/\s+/g, "_");

  try {
    const candidates: string[] = fs
      .readdirSync(outDir)
      .filter((f) => {
        const fLower = f.toLowerCase();
        if (!fLower.endsWith(".vtt")) return false;

        // Accept:
        //   <base>.vtt
        //   <base>.<lang>.vtt
        //   <base_with_underscores>.vtt
        //   <base_with_underscores>.<lang>.vtt
        const stem = fLower.slice(0, -4); // remove ".vtt"
        return stem.startsWith(baseLower) || stem.startsWith(baseUnderscore);
      })
      .sort((a, b) => {
        try {
          const aT = fs.statSync(path.join(outDir, a)).mtimeMs;
          const bT = fs.statSync(path.join(outDir, b)).mtimeMs;
          return bT - aT; // newest first
        } catch {
          return 0;
        }
      });

    const first: string | undefined = candidates.length ? candidates[0] : undefined;
    if (first) return path.join(outDir, first);
  } catch {
    // ignore dir read errors; we'll fall through and return null
  }
  return null;
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
    const chosenCli = cli ?? "whisper";

    // Common args
    const mdl = model ?? "small";
    const langArgs = language && language.trim() ? ["--language", language.trim()] : [];

    let attempts: Array<{ cmd: string; args: string[]; label: string }> = [];

    if (chosenCli === "whisper") {
      // 1) direct CLI
      attempts.push({
        cmd: "whisper",
        args: [wavPath, "--model", mdl, "--task", "transcribe", "--output_format", "vtt", "--output_dir", outDir, ...langArgs],
        label: "whisper",
      });
      // 2) py -m whisper (Windows-friendly)
      attempts.push({
        cmd: "py",
        args: ["-m", "whisper", wavPath, "--model", mdl, "--task", "transcribe", "--output_format", "vtt", "--output_dir", outDir, ...langArgs],
        label: "py -m whisper",
      });
      // 3) python -m whisper
      attempts.push({
        cmd: "python",
        args: ["-m", "whisper", wavPath, "--model", mdl, "--task", "transcribe", "--output_format", "vtt", "--output_dir", outDir, ...langArgs],
        label: "python -m whisper",
      });
      // 4) python3 -m whisper
      attempts.push({
        cmd: "python3",
        args: ["-m", "whisper", wavPath, "--model", mdl, "--task", "transcribe", "--output_format", "vtt", "--output_dir", outDir, ...langArgs],
        label: "python3 -m whisper",
      });
    } else {
      // faster-whisper variants
      // 1) direct CLI
      attempts.push({
        cmd: "faster-whisper",
        args: ["--model", mdl, "--output_dir", outDir, "--output_format", "vtt", ...langArgs, wavPath],
        label: "faster-whisper",
      });
      // 2) py -m faster_whisper.transcribe
      attempts.push({
        cmd: "py",
        args: ["-m", "faster_whisper.transcribe", "--model", mdl, "--output_dir", outDir, "--output_format", "vtt", ...langArgs, wavPath],
        label: "py -m faster_whisper.transcribe",
      });
      // 3) python -m faster_whisper.transcribe
      attempts.push({
        cmd: "python",
        args: ["-m", "faster_whisper.transcribe", "--model", mdl, "--output_dir", outDir, "--output_format", "vtt", ...langArgs, wavPath],
        label: "python -m faster_whisper.transcribe",
      });
      // 4) python3 -m faster_whisper.transcribe
      attempts.push({
        cmd: "python3",
        args: ["-m", "faster_whisper.transcribe", "--model", mdl, "--output_dir", outDir, "--output_format", "vtt", ...langArgs, wavPath],
        label: "python3 -m faster_whisper.transcribe",
      });
    }

    // Try each attempt until one succeeds.
    let lastErr = "";
    for (const a of attempts) {
      const r = await runAndCapture(a.cmd, a.args);
      if (r.code === 0) {
        const producedVtt = findVtt(outDir, base);
        if (!producedVtt) {
          // tool exited 0 but no file—return diagnostics for visibility
          console.warn(`[transcribe] Success exit but no VTT. label=${a.label}\nSTDERR:\n${r.stderr}\nSTDOUT:\n${r.stdout}`);
          return NextResponse.json(
            { ok: false, error: `VTT not produced by ${a.label}`, stderr: r.stderr, stdout: r.stdout },
            { status: 500 }
          );
        }
        return NextResponse.json({ ok: true, vttPath: producedVtt });
      }
      lastErr += `\n[${a.label}] exit ${r.code}\n---stderr---\n${r.stderr}\n---stdout---\n${r.stdout}\n`;
    }

    return NextResponse.json(
      { ok: false, error: "Transcribe failed (all launch attempts).", details: lastErr },
      { status: 500 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
