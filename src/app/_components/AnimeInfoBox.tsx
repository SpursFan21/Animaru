//src\app\_components\AnimeInfoBox.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

type AnimeRow = {
  id: string;
  title: string;
  synopsis: string | null;
  year: number | null;
  status: string | null;
  genres: string[] | string | null; // handle array or CSV
  episodes: number | null;
};

type Props = {
  animeId: string;
};

export default function AnimeInfoBox({ animeId }: Props) {
  const [anime, setAnime] = useState<AnimeRow | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from("anime")
        .select("id, title, synopsis, year, status, genres, episodes")
        .eq("id", animeId)
        .maybeSingle();

      if (error) {
        console.warn("anime fetch error:", error.message);
      }
      if (mounted) setAnime(data as AnimeRow | null);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [animeId]);

  const genresText = useMemo(() => {
    if (!anime?.genres) return null;
    if (Array.isArray(anime.genres)) return anime.genres.join(", ");
    // if stored as CSV text
    return anime.genres;
  }, [anime?.genres]);

  if (!anime) {
    return (
      <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4 text-slate-400 text-sm">
        Loading anime info…
      </div>
    );
  }

  const synopsis = anime.synopsis ?? "";
  const isLong = synopsis.length > 220;
  const shown = expanded || !isLong ? synopsis : synopsis.slice(0, 220) + "…";

  return (
    <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4">
      <h2 className="text-lg font-semibold text-slate-100 mb-2">{anime.title}</h2>

      {synopsis && (
        <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap leading-relaxed">
          {shown}{" "}
          {isLong && (
            <button
              onClick={() => setExpanded((s) => !s)}
              className="text-sky-400 hover:underline ml-1"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>
      )}

      <div className="space-y-1 text-sm text-slate-400">
        {anime.year !== null && (
          <div>
            <span className="text-slate-300 font-medium">Year:</span> {anime.year}
          </div>
        )}
        {anime.status && (
          <div>
            <span className="text-slate-300 font-medium">Status:</span> {anime.status}
          </div>
        )}
        {genresText && (
          <div>
            <span className="text-slate-300 font-medium">Genres:</span> {genresText}
          </div>
        )}
        {anime.episodes !== null && (
          <div>
            <span className="text-slate-300 font-medium">Episodes:</span> {anime.episodes}
          </div>
        )}
      </div>
    </div>
  );
}
