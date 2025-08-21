//src\app\anime\[slug]\page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";
import AnimePlayer from "../../_components/AnimePlayer";
import EpisodeList from "../../_components/EpisodeList";
import type { Episode } from "../../_components/EpisodeList";


type Anime = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  banner_path: string | null;
  cover_path: string | null;
};

export default function AnimeWatchPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // which episode is active
  const qsEp = Number(searchParams.get("e") ?? "0"); // optional ?e=12
  const [currentId, setCurrentId] = useState<string | null>(null);

  // load anime + episodes
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) anime by slug
        const { data: animeRows, error: ae } = await supabase
          .from("anime")
          .select("id, slug, title, synopsis, banner_path, cover_path")
          .eq("slug", params.slug)
          .limit(1)
          .returns<Anime[]>();

        if (ae) throw ae;
        const a = (animeRows ?? [])[0];
        if (!a) {
          throw new Error("Anime not found.");
        }
        if (!mounted) return;

        setAnime(a);

        // 2) episodes for this anime
        const { data: eps, error: ee } = await supabase
          .from("episodes")
          .select("id, anime_id, number, title, duration_seconds, playback_id, thumb_path")
          .eq("anime_id", a.id)
          .order("number", { ascending: true })
          .returns<Episode[]>();

        if (ee) throw ee;

        const clean = (eps ?? []).filter((e) => typeof e.number === "number");

        setEpisodes(clean);

        // pick episode by ?e or first
        const byQuery =
          clean.find((ep) => ep.number === qsEp) ?? clean[0] ?? null;

        setCurrentId(byQuery?.id ?? null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load anime.";
        setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [params.slug, qsEp]);

  const current = useMemo(
    () => episodes.find((e) => e.id === currentId) ?? null,
    [episodes, currentId]
  );

  const onSelectEpisode = (ep: Episode) => {
    setCurrentId(ep.id);
    // reflect in URL as ?e=number (shallow)
    const url = `/anime/${params.slug}?e=${ep.number}`;
    router.replace(url);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] px-4 py-6 text-slate-200">Loading…</div>
    );
  }

  if (err || !anime) {
    return (
      <div className="min-h-[70vh] px-4 py-6">
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
          {err ?? "Not found"}
        </div>
      </div>
    );
  }

  // poster for player: banner preferred, else cover
  const poster =
    anime.banner_path ??
    anime.cover_path ??
    null;

  return (
    <div className="px-4 py-6 text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Title & meta */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {anime.title}
            </h1>
            {anime.synopsis && (
              <p className="mt-2 text-slate-300 max-w-3xl">
                {anime.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* Layout: player (red) + episodes (blue) */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Player area */}
          <div className="flex-1 min-w-0">
            {current?.playback_id ? (
              <AnimePlayer
                playbackId={current.playback_id}
                poster={poster}
                title={anime.title}
                episodeLabel={`Episode ${current.number}${current.title ? ` – ${current.title}` : ""}`}
              />
            ) : (
              <div className="aspect-video rounded-xl border border-blue-800 bg-blue-950 grid place-items-center">
                <p className="text-slate-300">No video available for this episode.</p>
              </div>
            )}

            {/* simple controls/next-prev (optional) */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Prev/Next by number */}
              {(() => {
                if (!current) return null;
                const idx = episodes.findIndex((e) => e.id === current.id);
                const prev = idx > 0 ? episodes[idx - 1] : null;
                const next = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null;
                return (
                  <>
                    {prev && (
                      <button
                        className="px-3 py-1.5 rounded-md border border-blue-800 hover:border-sky-500"
                        onClick={() => onSelectEpisode(prev)}
                      >
                        ← Prev
                      </button>
                    )}
                    {next && (
                      <button
                        className="px-3 py-1.5 rounded-md border border-blue-800 hover:border-sky-500"
                        onClick={() => onSelectEpisode(next)}
                      >
                        Next →
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Episode list */}
          <EpisodeList
            episodes={episodes}
            currentId={currentId}
            onSelect={onSelectEpisode}
          />
        </div>
      </div>
    </div>
  );
}
