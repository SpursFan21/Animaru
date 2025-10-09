//src\app\genres\[genre]\page.tsx

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import AnimeModal, { type AnimeForModal } from "../../_components/AnimeModal";

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

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function coverUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export default function GenreAnimeList() {
  const params = useParams<{ genre: string }>();
  const raw = decodeURIComponent(params.genre).replace(/-/g, " ");
  const displayGenre = useMemo(() => titleCase(raw), [raw]);

  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnime, setModalAnime] = useState<AnimeForModal | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("anime")
          .select(
            "id, slug, title, synopsis, cover_path, genres, season, year, updated_at"
          )
          .contains("genres", [displayGenre])
          .order("updated_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;
        setAnimeList((data ?? []) as Anime[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load anime.";
        if (mounted) setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [displayGenre]);

  return (
    <main className="bg-blue-950 text-slate-100 min-h-screen px-4 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="text-sm text-slate-400 mb-3 text-center">
          <Link href="/" className="hover:text-sky-400">Home</Link> /{" "}
          <Link href="/genres" className="hover:text-sky-400">Genres</Link> /{" "}
          <span className="text-slate-300">{displayGenre}</span>
        </div>

        {/* Glowing header */}
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
          {displayGenre} <span className="text-slate-200">Anime</span>
        </h1>
        {/* Subheading */}
        <p className="text-center text-slate-400 mb-8">
          Showing all anime tagged with <span className="text-sky-400">{displayGenre}</span>.
        </p>

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
          ) : animeList.length === 0 ? (
            <p className="text-center text-slate-400">
              No anime found for{" "}
              <span className="text-slate-200 font-medium">{displayGenre}</span>.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {animeList.map((a) => {
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
                      className="group block h-full w-full rounded-lg overflow-hidden border border-blue-800 bg-blue-900/60 hover:border-sky-500 transition flex flex-col text-left min-h-[20rem]"
                    >
                      {/* Fixed 2:3 poster like homepage */}
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

                      {/* Title area (two-line clamp for consistency) */}
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
      </div>

      {/* Modal */}
      <AnimeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        anime={modalAnime}
      />
    </main>
  );
}
