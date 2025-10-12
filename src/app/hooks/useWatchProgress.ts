//Animaru\src\app\hooks\useWatchProgress.ts

import { useEffect, useRef } from "react";
import { upsertProgress, getEpisodeProgress } from "../lib/watchProgress";

type Args = {
  videoEl: HTMLVideoElement | null;
  animeId: string;
  episodeId: string;
  minResumeSec?: number; // default 5
};

export function useWatchProgress({
  videoEl,
  animeId,
  episodeId,
  minResumeSec = 5,
}: Args) {
  const saveTimer = useRef<number | null>(null);

// On mount/update: fetch progress and seek
useEffect(() => {
  if (!videoEl) return;

  void (async () => {
    try {
      // Treat as unknown first (not any), then narrow
      const raw: unknown = await getEpisodeProgress(episodeId);

      // Define the shape we expect
      type EpisodeProgressRow = { position_seconds: number | null; completed: boolean };

      // Narrow to our shape
      const prog: EpisodeProgressRow | null =
        raw && typeof raw === "object"
          ? (raw as EpisodeProgressRow)
          : null;

      const posVal = prog?.position_seconds;
      const resume =
        prog && !prog.completed && typeof posVal === "number"
          ? Math.floor(posVal)
          : 0;

      if (resume > minResumeSec) {
        const onLoaded = () => {
          videoEl.currentTime = resume;
        };
        if (videoEl.readyState >= 1) {
          videoEl.currentTime = resume;
        } else {
          videoEl.addEventListener("loadedmetadata", onLoaded, { once: true });
        }
      }
    } catch {
      // ignore fetch errors
    }
  })();
}, [videoEl, episodeId, minResumeSec]);


  // Write progress: every 10s or on pause/ended
  useEffect(() => {
    if (!videoEl) return;

    const THROTTLE_MS = 10_000;

    const save = async (completed = false) => {
      // guard against NaN/undefined duration
      if (!videoEl.duration || Number.isNaN(videoEl.duration)) return;

      const pos = videoEl.currentTime ?? 0;
      const dur = videoEl.duration ?? 0;

      // If user is past 90%, mark completed
      const done = completed || (dur > 0 && pos / dur >= 0.9);

      await upsertProgress({
        animeId,
        episodeId,
        // reset to 0 if completed to cue next-episode logic
        positionSec: done ? 0 : pos,
        durationSec: dur,
        completed: done,
      });
    };

    const onTimeUpdate = () => {
      if (saveTimer.current) return; // throttle
      saveTimer.current = window.setTimeout(() => {
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        // fire-and-forget; we don't want to block UI
        void save(false);
      }, THROTTLE_MS);
    };

    const onPause = () => {
      void save(false);
    };

    const onEnded = () => {
      void save(true);
    };

    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("pause", onPause);
    videoEl.addEventListener("ended", onEnded);

    return () => {
      videoEl.removeEventListener("timeupdate", onTimeUpdate);
      videoEl.removeEventListener("pause", onPause);
      videoEl.removeEventListener("ended", onEnded);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [videoEl, animeId, episodeId]);
}
