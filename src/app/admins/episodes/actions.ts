//Animaru\src\app\admins\episodes\actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

// helpers
const toInt = (v: FormDataEntryValue | null) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStrOrNull = (v: FormDataEntryValue | null) => {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
};

async function listSubtitlesInBucket() {
  const supabase = sbAdmin();
  const { data, error } = await supabase.storage.from("subtitles").list("", { limit: 1000 });
  if (error) return [];
  return (data ?? []).filter((f) => f.name.endsWith(".vtt")).map((f) => f.name);
}

export async function listAnime() {
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from("anime")
    .select("id, title, slug, season, year")
    .order("title", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAnimeWithEpisodes(animeId: string) {
  const supabase = sbAdmin();
  const [{ data: anime }, { data: episodes }, subtitles] = await Promise.all([
    supabase.from("anime").select("id,title,slug").eq("id", animeId).maybeSingle(),
    supabase
      .from("episodes")
      .select("*")
      .eq("anime_id", animeId)
      .order("season", { ascending: true })
      .order("number", { ascending: true }),
    listSubtitlesInBucket(),
  ]);
  if (!anime) throw new Error("Anime not found");
  return { anime, episodes: episodes ?? [], subtitles };
}

async function maybeUploadImage(
  file: File | null,
  filenameBase: string, // no folder, store filename only
  bucket: "covers" | "banners" = "covers"
) {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const supabase = sbAdmin();
  const filename = `${filenameBase}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return filename; // plain filename -> matches other rows
}

/* CREATE */
export async function createEpisodeAction(_prev: any, form: FormData) {
  try {
    const supabase = sbAdmin();

    const anime_id = form.get("anime_id") as string;
    const anime_title = (form.get("anime_title") as string) || "";
    const anime_slug = (form.get("anime_slug") as string) || "";
    const title = (form.get("title") as string) || "";
    const number = toInt(form.get("number"));
    if (!anime_id || !title || number == null) {
      return { ok: false, error: "Anime, title and episode number are required." };
    }

    const synopsis = toStrOrNull(form.get("synopsis"));
    const season = toInt(form.get("season"));
    const air_date = toStrOrNull(form.get("air_date"));
    const duration_seconds = toInt(form.get("duration_seconds"));
    const status = toStrOrNull(form.get("status"));
    const variant = toStrOrNull(form.get("variant"));

    const subsRaw = (form.get("subtitle_paths") as string) || "";
    const captions = subsRaw
      ? subsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // optional cover in 'covers' bucket -> thumb_path column
    const coverFile = form.get("cover") as File | null;
    const fileBase = `${anime_slug}-e${number}`;
    const thumb_path = await maybeUploadImage(coverFile, fileBase, "covers");

    // asset/playback IDs pasted from Mux dashboard
    const asset_id = toStrOrNull(form.get("asset_id"));
    const playback_id = toStrOrNull(form.get("playback_id"));

    const { error } = await supabase.from("episodes").insert({
      anime_id,
      anime_title,
      number,
      title,
      synopsis,
      season,
      air_date,
      duration_seconds,
      status,
      variant,
      captions, // jsonb array of strings (VTT filenames)
      thumb_path,
      asset_id,
      playback_id,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admins/episodes/${anime_id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Create failed" };
  }
}

/* UPDATE */
export async function updateEpisodeAction(_prev: any, form: FormData) {
  try {
    const supabase = sbAdmin();

    const id = form.get("id") as string;
    const anime_id = form.get("anime_id") as string;
    const anime_slug = (form.get("anime_slug") as string) || "";
    if (!id) return { ok: false, error: "Missing episode id." };

    const number = toInt(form.get("number"));
    const title = toStrOrNull(form.get("title"));
    const synopsis = toStrOrNull(form.get("synopsis"));
    const season = toInt(form.get("season"));
    const air_date = toStrOrNull(form.get("air_date"));
    const duration_seconds = toInt(form.get("duration_seconds"));
    const status = toStrOrNull(form.get("status"));
    const variant = toStrOrNull(form.get("variant"));

    const subsRaw = (form.get("subtitle_paths") as string) || "";
    const captions = subsRaw
      ? subsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const updates: any = {
      number,
      title,
      synopsis,
      season,
      air_date,
      duration_seconds,
      status,
      variant,
      captions,
      updated_at: new Date().toISOString(),
    };

    // optional cover replacement → covers bucket
    const coverFile = form.get("cover") as File | null;
    if (coverFile && coverFile.size > 0 && number != null) {
      updates.thumb_path = await maybeUploadImage(coverFile, `${anime_slug}-e${number}`, "covers");
    }

    // allow editing/clearing Mux IDs manually
    updates.asset_id = toStrOrNull(form.get("asset_id"));
    updates.playback_id = toStrOrNull(form.get("playback_id"));

    const { error } = await supabase.from("episodes").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admins/episodes/${anime_id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Update failed" };
  }
}

/* DELETE */
export async function deleteEpisodeAction(id: string, animeId: string) {
  try {
    const supabase = sbAdmin();
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admins/episodes/${animeId}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Delete failed" };
  }
}
