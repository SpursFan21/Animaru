//Animaru\src\app\lib\watchProgress.ts

import { supabase } from "../../utils/supabaseClient";

export type ProgressUpsert = {
  animeId: string;
  episodeId: string;
  positionSec: number;
  durationSec: number;
  completed?: boolean;
};

// Shape used by the reader helpers below
export type EpisodeProgressRow = {
  position_seconds: number | null;
  completed: boolean;
};

export type ContinueRow = {
  episode_id: string;
  position_seconds: number | null;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string; // ISO string from Postgres
};

/**
 * Upsert watch progress. Fire-and-forget—no value returned.
 * (Avoids `.select()` to keep types clean and faster writes.)
 */
export async function upsertProgress(p: ProgressUpsert): Promise<void> {
  const res = await supabase
    .from("watch_progress")
    .upsert(
      {
        anime_id: p.animeId,
        episode_id: p.episodeId,
        position_seconds: Math.floor(p.positionSec),
        duration_seconds: Math.floor(p.durationSec),
        completed: !!p.completed,
      },
      { onConflict: "user_id,episode_id" } // matches unique constraint
    );

  if (res.error) throw res.error;
}

/**
 * Read a single episode's progress for the current userId context
 * (the row-level security / auth context is handled by Supabase client).
 */
export async function getEpisodeProgress(
  episodeId: string
): Promise<EpisodeProgressRow | null> {
  const res = await supabase
    .from("watch_progress")
    .select("position_seconds, completed")
    .eq("episode_id", episodeId)
    .maybeSingle()
    .returns<EpisodeProgressRow | null>();

  if (res.error) throw res.error;
  return res.data; // typed as EpisodeProgressRow | null
}

/**
 * Latest progress for an anime (most recent row).
 */
export async function getContinueForAnime(
  animeId: string
): Promise<ContinueRow | null> {
  const res = await supabase
    .from("watch_progress")
    .select("episode_id, position_seconds, duration_seconds, completed, updated_at")
    .eq("anime_id", animeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<ContinueRow | null>();

  if (res.error) throw res.error;
  return res.data; // typed as ContinueRow | null
}
