//Animaru\src\app\hooks\useWatchProgress.ts

import { useEffect, useRef } from "react";
import { upsertProgress, getEpisodeProgress } from "../lib/watchProgress";

type Args = {
  videoEl: HTMLVideoElement | null;
  animeId: string;
  episodeId: string;
  // seek threshold to avoid jumping when user scrubbed near 0s:
  minResumeSec?: number; // default 5
};

export function useWatchProgress({ videoEl, animeId, episodeId, minResumeSec = 5 }: Args) {
  const saveTimer = useRef<number | null>(null);

  // On mount: fetch progress and seek
  useEffect(() => {
    if (!videoEl) return;
    (async () => {
      try {
        const prog = await getEpisodeProgress(episodeId);
        const resume = prog && !prog.completed ? prog.position_seconds ?? 0 : 0;
        if (resume > minResumeSec) {
          // Wait until metadata to know duration & allow seeking
          const onLoaded = () => {
            videoEl.currentTime = resume;
          };
          if (videoEl.readyState >= 1) videoEl.currentTime = resume;
          else videoEl.addEventListener("loadedmetadata", onLoaded, { once: true });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [videoEl, episodeId, minResumeSec]);

  // Write progress: every 10s or on pause/ended
  useEffect(() => {
    if (!videoEl) return;

    const THROTTLE_MS = 10_000;

    const save = async (completed = false) => {
      if (!videoEl.duration || isNaN(videoEl.duration)) return;
      const pos = videoEl.currentTime ?? 0;
      const dur = videoEl.duration ?? 0;
      // If user is past 90%, mark completed
      const done = completed || (dur > 0 && pos / dur >= 0.9);
      await upsertProgress({
        animeId,
        episodeId,
        positionSec: done ? 0 : pos,     // reset to 0 if completed to cue next ep logic
        durationSec: dur,
        completed: done,
      });
    };

    const onTimeUpdate = () => {
      if (saveTimer.current) return; // throttle
      saveTimer.current = window.setTimeout(async () => {
        saveTimer.current && clearTimeout(saveTimer.current);
        saveTimer.current = null;
        save(false);
      }, THROTTLE_MS);
    };

    const onPause = () => save(false);
    const onEnded = () => save(true);

    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("pause", onPause);
    videoEl.addEventListener("ended", onEnded);

    return () => {
      videoEl.removeEventListener("timeupdate", onTimeUpdate);
      videoEl.removeEventListener("pause", onPause);
      videoEl.removeEventListener("ended", onEnded);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [videoEl, animeId, episodeId]);
}