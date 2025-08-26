//src\app\api\episodes\sync\route.ts

import type { NextRequest } from "next/server";
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

type AniListResponse = {
  data?: {
    Media?: AniListMedia | null;
  };
};

async function fetchAniList(params: { id?: number; search?: string }): Promise<AniListMedia | null> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: params }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as AniListResponse;
  return json.data?.Media ?? null;
}

type JikanEp = { episode: number; title: string | null; aired: string | null };
type JikanPage = {
  data: Array<{ episode: number; title: string | null; aired: string | null }>;
  pagination: { has_next_page: boolean; current_page: number };
};

async function fetchAllJikanEpisodes(malId: number): Promise<JikanEp[]> {
  let page = 1;
  const out: JikanEp[] = [];

  // Paginate until Jikan says there's no next page
  let hasNext = true;
  while (hasNext) {
    const r = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${page}`);
    if (!r.ok) break;

    const j = (await r.json()) as JikanPage;
    for (const row of j.data) {
      out.push({ episode: row.episode, title: row.title, aired: row.aired });
    }

    hasNext = Boolean(j.pagination?.has_next_page);
    if (hasNext) page = Number(j.pagination.current_page) + 1;
  }

  return out;
}


// Minimal shape we read from the 'anime' table
type AnimeRow = {
  id: string;
  title: string;
  anilist_id: number | null;
  mal_id: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const { animeId, slug, anilistId, searchTitle } = (await req.json()) as {
      animeId?: string; // UUID in 'anime' table
      slug?: string; // alternative lookup
      anilistId?: number; // optional explicit AniList id
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
    const animeWhere: Partial<Record<"id" | "slug", string>> = animeId ? { id: animeId } : { slug: slug! };

    const { data: animeRows, error: aErr } = await supabase
      .from("anime")
      .select("id, title, anilist_id, mal_id")
      .match(animeWhere)
      .limit(1)
      .returns<AnimeRow[]>();

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
    const malId: number | null = media.idMal ?? anime.mal_id ?? null;
    const { error: upAnimeErr } = await supabase
      .from("anime")
      .update({ anilist_id: media.id, mal_id: malId })
      .eq("id", anime.id);
    if (upAnimeErr) throw upAnimeErr;

    // 3) Episode names via Jikan (if MAL id available)
    const fromJikan: JikanEp[] = malId ? await fetchAllJikanEpisodes(malId) : [];
    const byNumber = new Map<number, { title: string | null; aired: string | null }>();
    for (const ep of fromJikan) byNumber.set(ep.episode, { title: ep.title, aired: ep.aired });

    // Use AniList total if present; else fall back to how many Jikan gave us.
    const total: number = media.episodes ?? byNumber.size ?? 0;
    if (!total) {
      return new Response(JSON.stringify({ ok: true, message: "No episode count available yet." }), { status: 200 });
    }

    // 4) Build upserts 1..total (non-destructive; won’t clear existing Mux fields)
    const upserts: Array<{
      anime_id: string;
      number: number;
      title: string | null;
      air_date: string | null;
    }> = [];

    for (let n = 1; n <= total; n++) {
      const meta = byNumber.get(n);

      // Normalize types to avoid string | undefined leaking in
      const airedStr: string | null = meta?.aired ?? null;
      const airDate: string | null = airedStr
        ? (airedStr.split("T", 1)[0] ?? null) // [0] can be undefined by type; coalesce to null
        : null;

      upserts.push({
        anime_id: anime.id,
        number: n,
        title: meta?.title ?? null,
        air_date: airDate,
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "sync failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
