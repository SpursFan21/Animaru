//Animaru\src\app\continue-watching\page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";

type ProgressRow = {
  id: string;
  anime_id: string;
  episode_id: string;
  position_seconds: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
};

type Anime = {
  id: string;
  title: string;
  slug: string;
  cover_path: string | null;
  banner_path: string | null;
};

type Episode = {
  id: string;
  number: number | null;
  title: string | null;
};

// helper to build public storage URLs
function publicUrl(bucket: "banners" | "covers", path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function formatTime(sec: number | null | undefined) {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function ContinueWatchingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [animes, setAnimes] = useState<Record<string, Anime>>({});
  const [episodes, setEpisodes] = useState<Record<string, Episode>>({});
  const [loading, setLoading] = useState(true);

  // get current user
  useEffect(() => {
    let mounted = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) setUserId(data?.user?.id ?? null);
      })
      .catch((err) => {
        console.error("supabase.auth.getUser error", err);
        if (mounted) setUserId(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // fetch progress + hydrate anime/episodes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let mounted = true;

    void (async () => {
      setLoading(true);

      // 1) latest progress rows
      const { data: prog, error } = await supabase
        .from("watch_progress")
        .select(
          "id, anime_id, episode_id, position_seconds, duration_seconds, completed, updated_at"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (error) {
        console.warn("continue-watching load error", error.message);
        if (mounted) {
          setRows([]);
          setAnimes({});
          setEpisodes({});
          setLoading(false);
        }
        return;
      }

      const progress = (prog ?? []) as ProgressRow[];

      // 2) dedupe by anime_id (first occurrence is most recent due to sort)
      const seen = new Set<string>();
      const latestPerAnime: ProgressRow[] = [];
      for (const r of progress) {
        if (seen.has(r.anime_id)) continue;
        seen.add(r.anime_id);
        latestPerAnime.push(r);
      }

      // 3) fetch anime + episodes in bulk
      const animeIds = latestPerAnime.map((r) => r.anime_id);
      const episodeIds = latestPerAnime.map((r) => r.episode_id);

      const [{ data: animeRows }, { data: episodeRows }] = await Promise.all([
        animeIds.length
          ? supabase
              .from("anime")
              .select("id, title, slug, cover_path, banner_path")
              .in("id", animeIds)
          : Promise.resolve({ data: [] as Anime[] }),
        episodeIds.length
          ? supabase.from("episodes").select("id, number, title").in("id", episodeIds)
          : Promise.resolve({ data: [] as Episode[] }),
      ]);

      const animeArr = (animeRows ?? []) as Anime[];
      const episodeArr = (episodeRows ?? []) as Episode[];

      const animeMap: Record<string, Anime> = {};
      for (const a of animeArr) {
        animeMap[a.id] = a;
      }

      const epMap: Record<string, Episode> = {};
      for (const e of episodeArr) {
        epMap[e.id] = e;
      }

      if (mounted) {
        setRows(latestPerAnime);
        setAnimes(animeMap);
        setEpisodes(epMap);
        setLoading(false);
      }
    })().catch((err) => {
      console.error("continue-watching async error", err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (!userId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Continue Watching</h1>
        <p className="text-slate-300">Sign in to see your continue-watching list.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Continue Watching</h1>
        <p className="text-slate-300">Loading…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Continue Watching</h1>
        <p className="text-slate-300">No watch history yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-slate-100">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Continue Watching</h1>

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const a = animes[r.anime_id];
          const e = episodes[r.episode_id];
          const cover = a?.cover_path ? publicUrl("covers", a.cover_path) : null;
          const banner = a?.banner_path ? publicUrl("banners", a.banner_path) : null;
          const img = cover ?? banner ?? undefined;

          const pct =
            r.duration_seconds > 0
              ? Math.min(
                  100,
                  Math.max(0, Math.round((r.position_seconds / r.duration_seconds) * 100))
                )
              : 0;

          const epNum = typeof e?.number === "number" ? e.number : undefined;
          const href = epNum != null ? `/anime/${a?.slug}?e=${epNum}` : `/anime/${a?.slug}`;

          return (
            <li
              key={r.id}
              className="rounded-xl overflow-hidden border border-blue-900/50 bg-blue-950/40"
            >
              <Link href={href} className="block group">
                <div className="relative aspect-[16/9] bg-blue-900/40 overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={a?.title ?? "cover"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-400">
                      No image
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-700/60">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${r.completed ? 100 : pct}%` }}
                    />
                  </div>
                </div>

                <div className="p-3">
                  <div className="font-semibold text-slate-100 line-clamp-1">
                    {a?.title ?? "Unknown title"}
                  </div>
                  <div className="mt-1 text-sm text-slate-300 line-clamp-2">
                    {r.completed
                      ? e?.number != null
                        ? `Completed • Episode ${e.number}${e.title ? ` – ${e.title}` : ""}`
                        : `Completed`
                      : e?.number != null
                      ? `Resume • Episode ${e.number}${
                          e.title ? ` – ${e.title}` : ""
                        } • ${formatTime(r.position_seconds)} / ${formatTime(
                          r.duration_seconds
                        )} (${pct}%)`
                      : `Resume`}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Last watched {new Date(r.updated_at).toLocaleString()}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
