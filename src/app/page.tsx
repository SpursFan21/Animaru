//Animaru/src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../utils/supabaseClient";
import BannerSlider from "./_components/BannerSlider";
import AnimeModal, { type AnimeForModal } from "./_components/AnimeModal";

type Anime = {
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

function coverUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export default function Home() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnime, setModalAnime] = useState<AnimeForModal | null>(null);

  useEffect(() => {
    let mounted = true;

      const loadPopular = async (): Promise<Anime[]> => {
      // 1) read picks (be tolerant about order column name)
      const { data: picks, error: picksErr } = await supabase
        .from("popular_rotation")
        .select("*") // tolerate unknown order column name
        .limit(10);

      if (picksErr) {
        console.error("popular_rotation error:", picksErr);
        throw picksErr;
      }
      if (!picks || picks.length === 0) return [];

      // 2) normalize order field and sort
      const normalized = picks
        .map((p: any) => ({
          anime_id: p.anime_id,
          ord:
            p.order_position ??
            p.order_index ??
            p.order ??
            0, // default so sort is stable
        }))
        .sort((a: any, b: any) => a.ord - b.ord);

      const ids = normalized.map((p: any) => p.anime_id);

      // 3) fetch anime rows
      const { data: rows, error: rowsErr } = await supabase
        .from("anime")
        .select(
          "id, slug, title, synopsis, cover_path, genres, season, year, updated_at"
        )
        .in("id", ids);

      if (rowsErr) {
        console.error("anime fetch error:", rowsErr);
        throw rowsErr;
      }

      // 4) return in selected order
      const byId = new Map((rows ?? []).map((r) => [r.id, r]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as Anime[];
      return ordered;
    };


    const loadFallback = async (): Promise<Anime[]> => {
      const { data, error } = await supabase
        .from("anime")
        .select(
          "id, slug, title, synopsis, cover_path, genres, season, year, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Anime[];
    };

    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        let list = await loadPopular();
        if (list.length === 0) {
          // fallback to recent if rotation is empty
          list = await loadFallback();
        }
        if (!mounted) return;
        setAnime(list);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load anime.";
        setErr(msg);
        if (!mounted) return;
        // also fallback to recent if popular fetch failed
        try {
          const fallback = await loadFallback();
          if (!mounted) return;
          setAnime(fallback);
        } catch {
          // ignore, keep error visible
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="bg-blue-950 text-slate-100 min-h-screen">
      {/* Full-bleed Banner */}
      <section
        className="
          relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]
          overflow-hidden
        "
      >
        <BannerSlider />
      </section>

      {/* Popular / Trending */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-3xl font-bold">Popular Anime</h2>
          <Link href="/anime" className="text-sky-400 hover:underline">
            View all
          </Link>
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
          ) : anime.length === 0 ? (
            <p className="text-slate-300">No anime yet. Add some in the admin!</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {anime.map((a) => {
                const url = coverUrl(a.cover_path);
                return (
                  <li key={a.id} className="h-full">
                    <button
                      type="button"
                      onClick={() => {
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
                        setModalAnime(payload);
                        setModalOpen(true);
                      }}
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

      {/* Modal */}
      <AnimeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        anime={modalAnime}
      />
    </main>
  );
}
