//src\utils\extractAudio.ts

//this tool creates sound .wav files from .mp4 files, and is used in the process of creating closed captions for animaru
//load videos you want to exract into the media/videos/ folder and then run (npx tsx extract-audio.ts) in the projects terminal to begin processing the .wav files
//once complete the .wav files will be stored in the media/audio folder for further processing into .vtt or .srt captions

// src/utils/extractAudio.ts
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Turbopack-safe: dynamically import the OS-specific ffmpeg installer at runtime
let ffmpegLoaded = false;
async function ensureFFmpegLoaded() {
  if (ffmpegLoaded) return;

  const mod = await import("@ffmpeg-installer/ffmpeg"); // dynamic
  const ffmpegInstaller: any = (mod as any).default ?? mod;
  if (!ffmpegInstaller?.path) {
    throw new Error("Failed to resolve @ffmpeg-installer/ffmpeg path");
  }
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  ffmpegLoaded = true;
}

const CWD = process.cwd();
const CANDIDATE_INPUTS = [
  path.join(CWD, "media", "videos"),
  path.join(CWD, "src", "media", "videos"),
];

function pickExistingPath(paths: string[]): string | null {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

export async function extractAudioOne(fileName: string): Promise<string> {
  await ensureFFmpegLoaded();

  const picked = pickExistingPath(CANDIDATE_INPUTS);
  if (!picked) {
    throw new Error(
      "Input folder not found. Tried:\n" +
        CANDIDATE_INPUTS.map((p) => ` - ${p}`).join("\n")
    );
  }
  const INPUT_DIR = picked;
  const MEDIA_BASE = path.dirname(INPUT_DIR);
  const OUTPUT_DIR = path.join(MEDIA_BASE, "audio");
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fileName.toLowerCase().endsWith(".mp4")) {
    throw new Error("extractAudioOne expects an .mp4 filename");
  }

  const inputPath = path.join(INPUT_DIR, fileName);
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input video not found: " + inputPath);
  }

  const outName = fileName.replace(/\.mp4$/i, ".wav");
  const outputPath = path.join(OUTPUT_DIR, outName);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });

  return outputPath;
}
