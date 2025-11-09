//Animaru\src\app\admins\manage\actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Update handler used by the modal form.
 * Accepts the same fields as the Upload form plus the row id.
 * Only uploads cover/banner if a new file is provided.
 */
export async function updateAnimeAction(_prev: any, formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return { ok: false, error: "Missing anime id." };

  const title = (formData.get("title") as string) ?? "";
  if (!title) return { ok: false, error: "Title is required." };

  const inputSlug = (formData.get("slug") as string) || "";
  const slug = toSlug(inputSlug || title);

  const supabase = sbAdmin();

  const cover = formData.get("cover") as File | null;
  const banner = formData.get("banner") as File | null;

  let cover_path: string | undefined;
  let banner_path: string | undefined;

  if (cover && cover.size > 0) {
    const ext = cover.name.split(".").pop() || "jpg";
    const filename = `${slug}.${ext}`;
    const { error } = await supabase.storage
      .from("covers")
      .upload(filename, cover, { upsert: true, contentType: cover.type || undefined });
    if (error) return { ok: false, error: `Cover upload failed: ${error.message}` };
    cover_path = filename;
  }

  if (banner && banner.size > 0) {
    const ext = banner.name.split(".").pop() || "jpg";
    const filename = `${slug}.${ext}`;
    const { error } = await supabase.storage
      .from("banners")
      .upload(filename, banner, { upsert: true, contentType: banner.type || undefined });
    if (error) return { ok: false, error: `Banner upload failed: ${error.message}` };
    banner_path = filename;
  }

  const genresStr = (formData.get("genres") as string) || "";
  const genres =
    genresStr ? genresStr.split(",").map((g) => g.trim()).filter(Boolean) : null;

  const num = (key: string) => {
    const v = formData.get(key) as string | null;
    const n = v ? Number(v) : null;
    return Number.isFinite(n as number) ? (n as number) : null;
  };

  const payload: Record<string, any> = {
    slug,
    title,
    synopsis: ((formData.get("synopsis") as string) || null) as string | null,
    season: ((formData.get("season") as string) || null) as string | null,
    status: ((formData.get("status") as string) || null) as string | null,
    year: num("year"),
    episodes: num("episodes"),
    genres,
    anilist_id: num("anilist_id"),
    mal_id: num("mal_id"),
  };

  if (cover_path !== undefined) payload.cover_path = cover_path;
  if (banner_path !== undefined) payload.banner_path = banner_path;

  const { error: updErr } = await supabase
    .from("anime")
    .update(payload)
    .eq("id", id);

  if (updErr) return { ok: false, error: `Update failed: ${updErr.message}` };

  revalidatePath("/admins/manage");
  revalidatePath("/admins");
  return { ok: true, slug };
}
