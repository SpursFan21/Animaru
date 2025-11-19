//Animaru\src\app\_components\RecommendedForYou.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import type { AnimeForModal } from "./AnimeModal";

type AnimeRow = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  cover_path: string | null;
  genres: string[] | null;
  season: string | null;
  year: number | null;
  updated_at: string | null;
};

type RecommendedForYouProps = {
  onSelect?: (anime: AnimeForModal) => void;
};

function coverUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

/**
 * Recommender:
 * 1) read user's 4–5★ ratings
 * 2) build a genre weight profile (5★ = +2, 4★ = +1)
 * 3) fetch candidates that overlap any liked genres and are NOT in rated set
 * 4) score by sum of liked-genre weights, tie-break by recency and title
 */
export default function RecommendedForYou({ onSelect }: RecommendedForYouProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<AnimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // --- who am I?
        const { data: auth } = await supabase.auth.getUser();
        const u = auth?.user ?? null;
        if (!u) {
          if (mounted) {
            setUserId(null);
            setItems([]);
          }
          return;
        }
        if (mounted) setUserId(u.id);

        // --- 1) user’s positive ratings
        const { data: rated, error: rateErr } = await supabase
          .from("ratings")
          .select("anime_id, rating")
          .eq("user_id", u.id)
          .gte("rating", 4) // 4–5 stars
          .limit(500) // safety cap
          .returns<{ anime_id: string; rating: number }[]>();

        if (rateErr) throw rateErr;

        const pos = rated ?? [];
        const ratedAnimeIds = new Set(pos.map((r) => r.anime_id));

        // If nothing rated highly → nothing to recommend (UI will hide)
        if (pos.length === 0) {
          if (mounted) setItems([]);
          return;
        }

        // --- 2) pull genres for rated titles to build profile
        const { data: likedRows, error: likedErr } = await supabase
          .from("anime")
          .select("id, genres")
          .in("id", Array.from(ratedAnimeIds))
          .returns<{ id: string; genres: string[] | null }[]>();

        if (likedErr) throw likedErr;

        // weighted preference: 5★ = +2, 4★ = +1
        const weights = new Map<string, number>();
        const ratingMap = new Map(pos.map((r) => [r.anime_id, r.rating]));
        for (const a of likedRows ?? []) {
          const r = ratingMap.get(a.id) ?? 0;
          const add = r >= 5 ? 2 : 1;
          for (const g of a.genres ?? []) {
            weights.set(g, (weights.get(g) ?? 0) + add);
          }
        }

        const likedGenres = Array.from(weights.keys());
        if (likedGenres.length === 0) {
          if (mounted) setItems([]);
          return;
        }

        // --- 3) candidates: any overlap with liked genres, exclude rated set
        const { data: candidates, error: candErr } = await supabase
          .from("anime")
          .select(
            "id, slug, title, synopsis, cover_path, genres, season, year, updated_at"
          )
          .overlaps("genres", likedGenres)
          .not("id", "in", `(${Array.from(ratedAnimeIds).join(",") || "NULL"})`)
          .order("updated_at", { ascending: false })
          .limit(120) // wider pool so scoring has room
          .returns<AnimeRow[]>();

        if (candErr) throw candErr;

        // --- 4) score + sort
        const scored = (candidates ?? []).map((row) => {
          const score = (row.genres ?? []).reduce(
            (s, g) => s + (weights.get(g) ?? 0),
            0
          );
          return { row, score };
        });

        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const at = a.row.updated_at ?? "";
          const bt = b.row.updated_at ?? "";
          if (bt !== at) return bt.localeCompare(at);
          return a.row.title.localeCompare(b.row.title);
        });

        const top = scored.slice(0, 12).map((s) => s.row);
        if (mounted) setItems(top);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load recommendations.";
        if (mounted) setErr(msg), setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  // Hide the whole section if no user or no items (and not loading)
  if (!userId && !loading) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-3xl font-bold">Recommended for you</h2>
      </div>

      <div className="rounded-2xl bg-blue-900/40 border border-blue-800 p-4">
        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-blue-900/60 border border-blue-800 animate-pulse aspect-[2/3]"
              />
            ))}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {items.map((a) => {
              const url = coverUrl(a.cover_path);

              const payload: AnimeForModal = {
                id: a.id,
                slug: a.slug,
                title: a.title,
                synopsis: a.synopsis,
                cover_path: a.cover_path,
                genres: a.genres,
                season: a.season,
                year: a.year,
                episodes: null,
              };

              return (
                <li key={a.id} className="h-full">
                  <button
                    type="button"
                    onClick={() => onSelect?.(payload)}
                    className="group block h-full w-full rounded-lg overflow-hidden border border-blue-800 bg-blue-900/60 hover:border-sky-500 transition flex flex-col text-left"
                  >
                    <div className="relative w-full aspect-[2/3]">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={a.title}
                          className="absolute inset-0 h-full w-full object-cover group-hover:opacity-95"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold leading-snug line-clamp-2 min-h-[3rem] group-hover:text-sky-300">
                        {a.title}
                      </h3>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
