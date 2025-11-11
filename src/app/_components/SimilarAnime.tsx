//Animaru\src\app\_components\AnimeInfoBox.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";

type Row = {
  id: string;
  slug: string;
  title: string;
  cover_path: string | null;
  genres: string[] | null;
  updated_at: string | null;
};

function coverUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export default function SimilarAnime({ currentSlug }: { currentSlug: string }) {
  const [items, setItems] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Get the current anime's id + genres
        const { data: curRows, error: curErr } = await supabase
          .from("anime")
          .select("id, genres")
          .eq("slug", currentSlug)
          .limit(1)
          .returns<{ id: string; genres: string[] | null }[]>();

        if (curErr) throw curErr;
        const current = (curRows ?? [])[0];
        if (!current) throw new Error("Anime not found.");

        const tags = (current.genres ?? []).filter(Boolean);
        // If no genres, just fallback to recent
        if (tags.length === 0) {
          const { data: recent, error: recErr } = await supabase
            .from("anime")
            .select("id, slug, title, cover_path, genres, updated_at")
            .neq("id", current.id)
            .order("updated_at", { ascending: false })
            .limit(12)
            .returns<Row[]>();
          if (recErr) throw recErr;
          if (!mounted) return;
          setItems(recent ?? []);
          return;
        }

        // 2) Fetch candidates that share ANY of the genres
        //    (grab a wider net, we'll score client-side)
        const { data: candidates, error: candErr } = await supabase
          .from("anime")
          .select("id, slug, title, cover_path, genres, updated_at")
          .neq("id", current.id)
          .overlaps("genres", tags) // Postgres array overlap
          .order("updated_at", { ascending: false })
          .limit(60) // wider pool so our scoring has room
          .returns<Row[]>();

        if (candErr) throw candErr;

        // 3) Score by shared-genre count, then sort/trim to 12
        const tagSet = new Set(tags);
        const withScore = (candidates ?? []).map((r) => {
          const g = r.genres ?? [];
          const score = g.reduce((n, t) => (tagSet.has(t) ? n + 1 : n), 0);
          return { r, score };
        });

        withScore.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score; // most genres in common first
          // tie-breakers: more recent update, then title
          const at = a.r.updated_at ?? "";
          const bt = b.r.updated_at ?? "";
          if (bt !== at) return bt.localeCompare(at);
          return a.r.title.localeCompare(b.r.title);
        });

        const top = withScore.slice(0, 12).map((x) => x.r);
        if (!mounted) return;
        setItems(top);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load similar anime.";
        if (!mounted) return;
        setErr(msg);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [currentSlug]);

  const grid = useMemo(
    () =>
      loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-blue-900/60 border border-blue-800 animate-pulse aspect-[2/3]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-slate-300">No similar titles yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((a) => {
            const url = coverUrl(a.cover_path);
            return (
              <li key={a.id} className="h-full">
                <Link
                  href={`/anime/${a.slug}`}
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
                </Link>
              </li>
            );
          })}
        </ul>
      ),
    [items, loading]
  );

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold">Similar Anime</h2>
      </div>

      <div className="rounded-2xl bg-blue-900/40 border border-blue-800 p-4">
        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}
        {grid}
      </div>
    </section>
  );
}
