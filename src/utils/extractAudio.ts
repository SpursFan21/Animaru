//src\utils\extractAudio.ts

//this tool creates sound .wav files from .mp4 files, and is used in the process of creating closed captions for animaru
//load videos you want to exract into the media/videos/ folder and then run (npx tsx extract-audio.ts) in the projects terminal to begin processing the .wav files
//once complete the .wav files will be stored in the media/audio folder for further processing into .vtt or .srt captions

import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Prefer root /media/videos; fall back to /src/media/videos if needed.
const CWD = process.cwd();
const CANDIDATE_INPUTS: string[] = [
  path.join(CWD, "media", "videos"),        // root/media/videos
  path.join(CWD, "src", "media", "videos"), // src/media/videos
];

function pickExistingPath(paths: string[]): string | null {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function extractAudioAll(): Promise<void> {
  const picked = pickExistingPath(CANDIDATE_INPUTS);
  if (!picked) {
    throw new Error(
      "Input folder not found. Tried:\n" +
      CANDIDATE_INPUTS.map(p => ` - ${p}`).join("\n")
    );
  }

  // From here on, these are guaranteed strings (no undefined).
  const INPUT_DIR: string = picked;
  const MEDIA_BASE: string = path.dirname(INPUT_DIR); // .../media
  const OUTPUT_DIR: string = path.join(MEDIA_BASE, "audio");

  console.log("cwd:", CWD);
  console.log("FFmpeg binary:", ffmpegInstaller.path);
  console.log("INPUT_DIR chosen:", INPUT_DIR);
  console.log("OUTPUT_DIR:", OUTPUT_DIR);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("Created output folder:", OUTPUT_DIR);
  }

  const files: string[] = fs.readdirSync(INPUT_DIR);
  console.log("Files in input dir:", files);
  const mp4s: string[] = files.filter(f => f.toLowerCase().endsWith(".mp4"));

  if (mp4s.length === 0) {
    console.log(`No .mp4 files found in: ${INPUT_DIR}`);
    return;
  }

  for (const file of mp4s) {
    const inputPath = path.join(INPUT_DIR, file);
    const outName = file.replace(/\.mp4$/i, ".wav");
    const outputPath = path.join(OUTPUT_DIR, outName);

    console.log(`Extracting: ${file}`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .on("start", (cmd) => console.log("FFmpeg cmd:", cmd))
        .on("progress", (p) => {
          if (p?.targetSize) console.log(`… ${p.targetSize} KB written`);
        })
        .on("end", () => {
          console.log(`Created: ${outputPath}`);
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", (err as Error)?.message || err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  console.log("All videos processed!");
}
