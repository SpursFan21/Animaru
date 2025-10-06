//Animaru\src\app\lib\watchProgress.ts

import { supabase } from "../../utils/supabaseClient";

export type ProgressUpsert = {
  animeId: string;
  episodeId: string;
  positionSec: number;
  durationSec: number;
  completed?: boolean;
};

export async function upsertProgress(p: ProgressUpsert) {
  const { data, error } = await supabase
    .from("watch_progress")
    .upsert({
      anime_id: p.animeId,
      episode_id: p.episodeId,
      position_seconds: Math.floor(p.positionSec),
      duration_seconds: Math.floor(p.durationSec),
      completed: !!p.completed,
    }, { onConflict: "user_id,episode_id" })  // based on the unique constraint
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEpisodeProgress(episodeId: string) {
  const { data, error } = await supabase
    .from("watch_progress")
    .select("position_seconds, completed")
    .eq("episode_id", episodeId)
    .maybeSingle();
  if (error) throw error;
  return data; // { position_seconds, completed } | null
}

// For “Continue Watching” from anime page
export async function getContinueForAnime(animeId: string) {
  const { data, error } = await supabase
    .from("watch_progress")
    .select("episode_id, position_seconds, duration_seconds, completed, updated_at")
    .eq("anime_id", animeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
