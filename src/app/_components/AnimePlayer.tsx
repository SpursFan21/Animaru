//src\app\_components\AnimePlayer.tsx

"use client";

import { useCallback, useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { supabase } from "../../utils/supabaseClient";

type Props = {
  playbackId: string;
  animeId: string;
  episodeId: string;
  userId: string; // required to associate progress (can be "")
  title?: string;
  poster?: string | null;
  episodeLabel?: string;
  signedUrl?: string;
};

const SAVE_INTERVAL = 10_000;

// Minimal element surface we need from <mux-player>
type MuxEl = {
  currentTime: number;
  duration: number;
  readyState: number;
  addEventListener: (
    type: "timeupdate" | "pause" | "ended" | "loadedmetadata",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: "timeupdate" | "pause" | "ended" | "loadedmetadata",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
};

type ProgressRow = {
  position_seconds: number | null;
  completed: boolean;
};

export default function AnimePlayer({
  playbackId,
  animeId,
  episodeId,
  userId,
  title,
  poster,
  episodeLabel,
  signedUrl,
}: Props) {
  const envKey = process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY;
  const playerRef = useRef<MuxEl | null>(null);
  const lastSaved = useRef<number>(0);
  const lastPosition = useRef<number>(0);

  // Fetch existing progress (only if logged in)
  useEffect(() => {
    if (!userId) return;

    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from("watch_progress")
        .select("position_seconds, completed")
        .eq("episode_id", episodeId)
        .eq("user_id", userId)
        .maybeSingle<ProgressRow>();

      if (error) {
        console.warn("progress fetch error", error.message);
        return;
      }

      if (data && !data.completed && (data.position_seconds ?? 0) > 5) {
        const el = playerRef.current;
        if (!el) return;

        const resume = Math.floor(data.position_seconds ?? 0);
        const onReady = () => {
          el.currentTime = resume;
        };

        if (el.readyState >= 1) {
          el.currentTime = resume;
        } else {
          el.addEventListener("loadedmetadata", onReady, { once: true });
        }
      }
    };

    void fetchProgress();
  }, [episodeId, userId]);

  // Memoized writer to avoid missing-deps warning
  const saveProgress = useCallback(
    async (completed = false) => {
      if (!userId) return; // don’t write for guests
      const el = playerRef.current;
      if (!el?.duration || Number.isNaN(el.duration)) return;

      const pos = el.currentTime ?? 0;
      const dur = el.duration ?? 0;

      // skip tiny changes unless completing
      if (Math.abs(pos - lastPosition.current) < 3 && !completed) return;

      lastPosition.current = pos;
      const done = completed || (dur > 0 && pos / dur >= 0.9);

      const payload = {
        user_id: userId,
        anime_id: animeId,
        episode_id: episodeId,
        position_seconds: done ? 0 : Math.floor(pos),
        duration_seconds: Math.floor(dur),
        completed: done,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("watch_progress")
        .upsert(payload, { onConflict: "user_id,episode_id" });

      if (error) console.warn("progress save error", error.message);
    },
    [animeId, episodeId, userId]
  );

  // Hook into player events
  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;

    const handleTimeUpdate: EventListener = () => {
      if (!userId) return; // guests: no-op
      const now = Date.now();
      if (now - lastSaved.current >= SAVE_INTERVAL) {
        lastSaved.current = now;
        void saveProgress(false);
      }
    };

    const handlePause: EventListener = () => {
      void saveProgress(false);
    };

    const handleEnded: EventListener = () => {
      void saveProgress(true);
    };

    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("pause", handlePause);
    el.addEventListener("ended", handleEnded);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("ended", handleEnded);
    };
  }, [saveProgress, userId]);

  return (
    <div className="relative w-full">
    <MuxPlayer
      ref={(el) => {
        // el is unknown here; narrow to our minimal surface
        playerRef.current = (el as unknown as MuxEl) ?? null;
      }}
      playbackId={signedUrl ? undefined : playbackId}
      src={signedUrl}
      streamType="on-demand"
      autoPlay={false}
      muted={false}
      poster={poster ?? undefined}
      metadata={{
        video_id: playbackId,
        video_title: episodeLabel ?? title ?? "",
      }}
      envKey={envKey}
      primaryColor="#38bdf8"
      accentColor="#94a3b8"
      defaultHiddenCaptions={false}
      style={{
        aspectRatio: "16 / 9",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />

    </div>
  );
}
