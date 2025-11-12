//Animaru/src/app/_components/TrendingSidebar.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../utils/supabaseClient";

type Period = "week" | "month";

type TrendRow = {
  anime_id: string;
  views: number;
};

type Anime = {
  id: string;
  slug: string;
  title: string;
  cover_path: string | null;
};

function coverUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

export default function TrendingSidebar() {
  const [period, setPeriod] = useState<Period>("week");
  const [items, setItems] = useState<Anime[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const startISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (period === "week" ? 7 : 30));
    return d.toISOString();
  }, [period]);

  useEffect(() => {
    let mounted = true;

    async function fetchTrending() {
      setLoading(true);
      try {
        // --- client-side aggregation (TS-safe, portable)
        const { data: raw, error: wpErr } = await supabase
          .from("watch_progress")
          .select("anime_id, updated_at")
          .gte("updated_at", startISO)
          .limit(5000); // MVP cap; tune/paginate later

        if (wpErr) throw wpErr;

        const counts = new Map<string, number>();
        for (const r of raw ?? []) {
          counts.set(r.anime_id, (counts.get(r.anime_id) ?? 0) + 1);
        }

        let grouped: TrendRow[] = Array.from(counts.entries())
          .map(([anime_id, views]) => ({ anime_id, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 20);

        const ids = grouped.map((g) => g.anime_id);

        // hydrate anime rows
        const { data: animeRows } = await supabase
          .from("anime")
          .select("id, slug, title, cover_path")
          .in("id", ids)
          .returns<Anime[]>();

        const byId = new Map((animeRows ?? []).map((r) => [r.id, r]));

        // build ranked list in order
        let ranked: Anime[] = grouped
          .map((g) => byId.get(g.anime_id))
          .filter(Boolean) as Anime[];

        // fallback fill from popular_rotation if < 10
        if (ranked.length < 10) {
          const need = 10 - ranked.length;
          const have = new Set(ranked.map((r) => r.id));

          const { data: pops } = await supabase
            .from("popular_rotation")
            .select("anime_id, order")
            .order("order", { ascending: true });

          const extraIds =
            (pops ?? [])
              .map((p) => p.anime_id)
              .filter((id) => !have.has(id))
              .slice(0, need) || [];

          if (extraIds.length) {
            const { data: extra } = await supabase
              .from("anime")
              .select("id, slug, title, cover_path")
              .in("id", extraIds)
              .returns<Anime[]>();
            ranked = ranked.concat(extra ?? []);
          }
        }

        ranked = ranked.slice(0, 10);

        if (!mounted) return;
        setItems(ranked);
        setViewCounts(Object.fromEntries(grouped.map((g) => [g.anime_id, g.views])));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchTrending();
    return () => {
      mounted = false;
    };
  }, [startISO]);

  return (
    <aside className="rounded-2xl border border-blue-800 bg-blue-900/40 p-4 lg:sticky lg:top-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-bold">Top 10</h3>
        <div className="inline-flex rounded-md overflow-hidden border border-blue-800">
          <button
            className={[
              "px-3 py-1.5 text-sm",
              period === "week" ? "bg-sky-600 text-white" : "bg-blue-900/40 hover:bg-blue-900",
            ].join(" ")}
            onClick={() => setPeriod("week")}
          >
            This week
          </button>
          <button
            className={[
              "px-3 py-1.5 text-sm border-l border-blue-800",
              period === "month" ? "bg-sky-600 text-white" : "bg-blue-900/40 hover:bg-blue-900",
            ].join(" ")}
            onClick={() => setPeriod("month")}
          >
            Month
          </button>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-blue-800 bg-blue-900/60 p-2 animate-pulse"
            >
              <div className="h-8 w-8 rounded-md bg-blue-800/70" />
              <div className="h-14 w-10 rounded bg-blue-800/70" />
              <div className="flex-1 h-4 rounded bg-blue-800/70" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {items.map((a, idx) => {
            const thumb = coverUrl(a.cover_path);
            const views = viewCounts[a.id] ?? null;
            return (
              <li key={a.id}>
                <Link
                  href={`/anime/${a.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-blue-800 bg-blue-900/60 p-2 hover:border-sky-500 transition"
                >
                  <div className="grid place-items-center h-8 w-8 rounded-md bg-blue-800/60 text-sm font-bold text-slate-200">
                    {(idx + 1).toString().padStart(2, "0")}
                  </div>

                  <div className="relative h-14 w-10 overflow-hidden rounded">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={a.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-slate-400">
                        N/A
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium group-hover:text-sky-300">
                      {a.title}
                    </div>
                    {views !== null && (
                      <div className="text-xs text-slate-400">{views} views</div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
