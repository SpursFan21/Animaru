//src\app\_components\AnimePlayer.tsx

"use client";

import { useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { supabase } from "../../utils/supabaseClient";

type Props = {
  playbackId: string;
  animeId: string;
  episodeId: string;
  userId: string;               // required to associate progress (can be "")
  title?: string;
  poster?: string | null;
  episodeLabel?: string;
  signedUrl?: string;
};

const SAVE_INTERVAL = 10_000;

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
  const playerRef = useRef<any>(null);
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
        .maybeSingle();

      if (error) {
        console.warn("progress fetch error", error.message);
        return;
      }

      if (data && !data.completed && data.position_seconds > 5) {
        const el = playerRef.current;
        if (el) {
          const resume = data.position_seconds;
          const onReady = () => {
            el.currentTime = resume;
          };
          if (el.readyState >= 1) el.currentTime = resume;
          else el.addEventListener("loadedmetadata", onReady, { once: true });
        }
      }
    };
    void fetchProgress();
  }, [episodeId, userId]);

  async function saveProgress(completed = false) {
    if (!userId) return; // don’t write for guests
    const el = playerRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;
    const pos = el.currentTime ?? 0;
    const dur = el.duration ?? 0;

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
  }

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;

    const handleTimeUpdate = () => {
      if (!userId) return; // guests: no-op
      const now = Date.now();
      if (now - lastSaved.current >= SAVE_INTERVAL) {
        lastSaved.current = now;
        void saveProgress(false);
      }
    };

    const handlePause = () => void saveProgress(false);
    const handleEnded = () => void saveProgress(true);

    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("pause", handlePause);
    el.addEventListener("ended", handleEnded);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("ended", handleEnded);
    };
  }, [animeId, episodeId, userId]);

  return (
    <div className="relative w-full">
      <MuxPlayer
        ref={playerRef}
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
        style={{ aspectRatio: "16 / 9", width: "100%", borderRadius: 12, overflow: "hidden" }}
      />
    </div>
  );
}
