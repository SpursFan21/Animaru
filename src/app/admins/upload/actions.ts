//Animaru\src\app\admins\upload\actions.ts

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

export async function createAnimeAction(_prev: any, formData: FormData) {
  const rawTitle = (formData.get("title") as string) ?? "";
  if (!rawTitle) return { ok: false, error: "Title is required." };

  const inputSlug = (formData.get("slug") as string) || "";
  const slug = toSlug(inputSlug || rawTitle);

  const cover = formData.get("cover") as File | null;
  const banner = formData.get("banner") as File | null;

  const supabase = sbAdmin();

  let cover_path: string | null = null;
  let banner_path: string | null = null;

  if (cover && cover.size > 0) {
    const ext = cover.name.split(".").pop() || "jpg";
    const filename = `${slug}.${ext}`;           // <— filename only
    const { error } = await supabase.storage
      .from("covers")
      .upload(filename, cover, { upsert: true, contentType: cover.type || undefined });
    if (error) return { ok: false, error: `Cover upload failed: ${error.message}` };
    cover_path = filename;                        // <— store filename only
  }

  if (banner && banner.size > 0) {
    const ext = banner.name.split(".").pop() || "jpg";
    const filename = `${slug}.${ext}`;
    const { error } = await supabase.storage
      .from("banners")
      .upload(filename, banner, { upsert: true, contentType: banner.type || undefined });
    if (error) return { ok: false, error: `Banner upload failed: ${error.message}` };
    banner_path = filename;                       // <— store filename only
  }

  const genresStr = (formData.get("genres") as string) || "";
  const genres = genresStr
    ? genresStr.split(",").map((g) => g.trim()).filter(Boolean)
    : null;

  const num = (key: string) => {
    const v = formData.get(key) as string | null;
    const n = v ? Number(v) : null;
    return Number.isFinite(n as number) ? (n as number) : null;
  };

  const payload = {
    slug,
    title: rawTitle,
    synopsis: ((formData.get("synopsis") as string) || null) as string | null,
    season: ((formData.get("season") as string) || null) as string | null,
    status: ((formData.get("status") as string) || null) as string | null,
    year: num("year"),
    episodes: num("episodes"),
    genres,
    anilist_id: num("anilist_id"),
    mal_id: num("mal_id"),
    cover_path,   // filename only
    banner_path,  // filename only
  };

  const { error: insertErr } = await supabase.from("anime").insert(payload);
  if (insertErr) return { ok: false, error: `Insert failed: ${insertErr.message}` };

  revalidatePath("/admins");
  return { ok: true, slug };
}
