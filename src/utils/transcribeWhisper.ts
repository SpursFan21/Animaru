//Animaru\src\utils\transcribeWhisper.ts

import path from "path";
import { spawn } from "child_process";
import fs from "fs";

type WhisperOpts = {
  wavPath: string;               // absolute path
  model: string;                 // e.g. tiny/base/small/medium/large-v3
  language?: string;             // e.g. "en" (omit for auto)
  cli?: "whisper" | "faster-whisper"; // which CLI you installed
  outDir?: string;               // defaults next to wav
};

export async function transcribeWhisperVTT(opts: WhisperOpts): Promise<string> {
  const { wavPath, model, language, cli = "whisper", outDir } = opts;
  if (!fs.existsSync(wavPath)) throw new Error("wav file not found: " + wavPath);

  const dir = outDir ?? path.dirname(wavPath);
  const base = path.basename(wavPath, path.extname(wavPath));

  const args: string[] =
    cli === "whisper"
      ? [
          wavPath,
          "--task", "transcribe",
          "--model", model,
          "--output_format", "vtt",
          "--output_dir", dir,
          ...(language ? ["--language", language] : []),
        ]
      : [
          wavPath,
          "--task", "transcribe",
          "--model", model,
          "--output", dir,
          "--output-format", "vtt",
          ...(language ? ["--language", language] : []),
        ];

  await new Promise<void>((resolve, reject) => {
    const p = spawn(cli, args, { stdio: "inherit", shell: process.platform === "win32" });
    p.on("error", reject);
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cli} exited ${code}`))));
  });

  // Whisper names like "<base>.vtt"
  const vttPath = path.join(dir, `${base}.vtt`);
  if (!fs.existsSync(vttPath)) {
    // some CLIs output "<base>.<lang>.vtt"
    const alt = fs.readdirSync(dir).find(f => f.startsWith(base) && f.endsWith(".vtt"));
    if (!alt) throw new Error("VTT not found after transcription");
    return path.join(dir, alt);
  }
  return vttPath;
}
