//src\app\api\episodes\sync\route.ts

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AniListMedia = {
  id: number;
  idMal: number | null;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  episodes: number | null;
};

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_QUERY = `
  query ($id: Int, $search: String) {
    Media(id: $id, search: $search, type: ANIME) {
      id
      idMal
      title { romaji english native }
      episodes
    }
  }
`;

async function fetchAniList(params: { id?: number; search?: string }): Promise<AniListMedia | null> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: params }),
    // AniList is public; no token needed
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.Media ?? null;
}

type JikanEp = { episode: number; title: string | null; aired: string | null };
type JikanPage = {
  data: Array<{ episode: number; title: string | null; aired: string | null }>;
  pagination: { has_next_page: boolean; current_page: number };
};

async function fetchAllJikanEpisodes(malId: number): Promise<JikanEp[]> {
  let page = 1;
  const out: JikanEp[] = [];
  while (true) {
    const r = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${page}`);
    if (!r.ok) break;
    const j: JikanPage = await r.json();
    for (const row of j.data) out.push({ episode: row.episode, title: row.title, aired: row.aired });
    if (!j.pagination?.has_next_page) break;
    page = (j.pagination.current_page ?? page) + 1;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { animeId, slug, anilistId, searchTitle } = (await req.json()) as {
      animeId?: string;     // UUID in 'anime' table
      slug?: string;        // alternative lookup
      anilistId?: number;   // optional explicit AniList id
      searchTitle?: string; // optional fallback title to search
    };

    if (!animeId && !slug) {
      return new Response(JSON.stringify({ error: "animeId or slug required" }), { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Supabase environment not configured" }), { status: 500 });
    }

    // Server-side Supabase (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1) Load anime
    const animeWhere = animeId ? { id: animeId } : { slug };
    const { data: animeRows, error: aErr } = await supabase
      .from("anime")
      .select("id, title, anilist_id, mal_id")
      .match(animeWhere)
      .limit(1);
    if (aErr) throw aErr;

    const anime = (animeRows ?? [])[0];
    if (!anime) return new Response(JSON.stringify({ error: "Anime not found" }), { status: 404 });

    // 2) Resolve AniList
    const media = await fetchAniList(
      anilistId ? { id: anilistId } : { search: searchTitle ?? anime.title }
    );
    if (!media) {
      return new Response(JSON.stringify({ error: "AniList: not found" }), { status: 404 });
    }

    // Persist IDs (keep mal_id if we discover it)
    const malId = media.idMal ?? anime.mal_id ?? null;
    await supabase.from("anime").update({ anilist_id: media.id, mal_id: malId }).eq("id", anime.id);

    // 3) Episode names via Jikan (if MAL id available)
    const fromJikan = malId ? await fetchAllJikanEpisodes(malId) : [];
    const byNumber = new Map<number, { title: string | null; aired: string | null }>();
    for (const ep of fromJikan) byNumber.set(ep.episode, { title: ep.title, aired: ep.aired });

    // Use AniList total if present; else fall back to how many Jikan gave us.
    const total = media.episodes ?? byNumber.size ?? 0;
    if (!total) {
      return new Response(JSON.stringify({ ok: true, message: "No episode count available yet." }), { status: 200 });
    }

    // 4) Build upserts 1..total (non-destructive; won’t clear existing Mux fields)
    const upserts = [];
    for (let n = 1; n <= total; n++) {
      const meta = byNumber.get(n);
      upserts.push({
        anime_id: anime.id,
        number: n,
        title: meta?.title ?? null,
        air_date: meta?.aired ? meta.aired.split("T")[0] : null,
      });
    }

    const { error: upErr } = await supabase
      .from("episodes")
      .upsert(upserts, { onConflict: "anime_id,number" });
    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({
        ok: true,
        anilist_id: media.id,
        mal_id: malId,
        episodes_upserted: upserts.length,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "sync failed" }), { status: 500 });
  }
}
