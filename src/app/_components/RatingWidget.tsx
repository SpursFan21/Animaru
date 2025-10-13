// src/app/_components/RatingWidget.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

type Props = {
  animeId: string;
  userId: string | null; // null if signed out
};

type Stats = { avg_rating: number; ratings_count: number };

export default function RatingWidget({ animeId, userId }: Props) {
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>({ avg_rating: 0, ratings_count: 0 });
  const [saving, setSaving] = useState(false);

  // fetch user's rating + aggregate stats
  useEffect(() => {
    let mounted = true;

    async function load() {
      // ---- My rating
      if (userId) {
        const res = await supabase
          .from("ratings")
          .select("rating")
          .eq("anime_id", animeId)
          .eq("user_id", userId)
          .maybeSingle();

        const raw: unknown = res.data;
        const my =
          raw && typeof raw === "object" && "rating" in (raw as Record<string, unknown>)
            ? (raw as { rating: unknown })
            : null;

        const value = my && typeof my.rating === "number" ? my.rating : null;
        if (mounted) setMyRating(value);
      } else {
        setMyRating(null);
      }

      // ---- Stats (RPC may return a row or [row])
      const rpcRes = await supabase.rpc("get_rating_stats", { p_anime_id: animeId });
      const rpcRaw: unknown = rpcRes.data;

      // Coerce to a safe partial shape instead of indexing `unknown`/`any`
      const srcObj =
        (Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw) as
          | { avg_rating?: unknown; ratings_count?: unknown }
          | null;

      const safe: Stats = {
        avg_rating: Number(srcObj?.avg_rating ?? 0),
        ratings_count: Number(srcObj?.ratings_count ?? 0),
      };

      if (mounted) setStats(safe);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [animeId, userId]);

  async function submit(r: number) {
    if (!userId) {
      alert("Please sign in to rate.");
      return;
    }
    setSaving(true);
    setMyRating(r); // optimistic update

    // upsert (user_id, anime_id) unique
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { user_id: userId, anime_id: animeId, rating: r },
        { onConflict: "user_id,anime_id" }
      );

    if (error) {
      console.warn("rating save error", error.message);
    }

    // refresh stats
    const rpcRes2 = await supabase.rpc("get_rating_stats", { p_anime_id: animeId });
    const rpcRaw2: unknown = rpcRes2.data;

    const srcObj2 =
      (Array.isArray(rpcRaw2) ? rpcRaw2[0] : rpcRaw2) as
        | { avg_rating?: unknown; ratings_count?: unknown }
        | null;

    const safe: Stats = {
      avg_rating: Number(srcObj2?.avg_rating ?? 0),
      ratings_count: Number(srcObj2?.ratings_count ?? 0),
    };
    setStats(safe);

    setSaving(false);
  }

  const roundedAvg = useMemo(() => Number(stats.avg_rating ?? 0), [stats]);
  const avgLabel = `${roundedAvg.toFixed(1)} / 5 (${stats.ratings_count} rating${
    stats.ratings_count === 1 ? "" : "s"
  })`;

  return (
    <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4">
      <div className="text-slate-200 font-semibold">Rate this anime</div>

      {/* Star picker */}
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (hover ?? myRating ?? 0) >= i;
          return (
            <button
              key={i}
              className={`text-2xl leading-none ${
                active ? "text-yellow-400" : "text-slate-500"
              } hover:text-yellow-300`}
              title={`${i} star${i === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => submit(i)}
              disabled={saving}
              aria-label={`${i} stars`}
            >
              ★
            </button>
          );
        })}
        {myRating !== null && (
          <span className="ml-2 text-sm text-slate-300">Your rating: {myRating}</span>
        )}
      </div>

      {/* Average display */}
      <div className="mt-3">
        {stats.ratings_count > 0 ? (
          <>
            <StarBar value={roundedAvg} />
            <div className="mt-1 text-xs text-slate-400">{avgLabel}</div>
          </>
        ) : (
          <div className="mt-3 text-xs text-slate-500">No ratings yet — be the first!</div>
        )}
      </div>
    </div>
  );
}

function StarBar({ value }: { value: number }) {
  const full = Math.floor(value);
  const frac = Math.max(0, Math.min(1, value - full));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const partial = i === full + 1 && frac > 0;
        return (
          <div key={i} className="relative w-5 h-5">
            <div className="absolute inset-0 text-slate-600">★</div>
            <div
              className={`absolute inset-0 overflow-hidden ${filled || partial ? "" : "w-0"}`}
              style={{ width: filled ? "100%" : partial ? `${frac * 100}%` : "0%" }}
            >
              <div className="absolute inset-0 text-yellow-400">★</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
