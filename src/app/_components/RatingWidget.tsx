// src\app\_components\RatingWidget.tsx

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
      // my rating
      if (userId) {
        const { data } = await supabase
          .from("ratings")
          .select("rating")
          .eq("anime_id", animeId)
          .eq("user_id", userId)
          .maybeSingle();
        if (mounted) setMyRating(data?.rating ?? null);
      } else {
        setMyRating(null);
      }

      // stats (RPC returns an array with one row)
      const { data: arr } = await supabase.rpc("get_rating_stats", { p_anime_id: animeId });
      const s = Array.isArray(arr) ? arr[0] : arr;
      if (mounted) setStats((s as Stats) ?? { avg_rating: 0, ratings_count: 0 });
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
      .upsert({ user_id: userId, anime_id: animeId, rating: r }, { onConflict: "user_id,anime_id" });

    if (error) {
      console.warn("rating save error", error.message);
    }

    // refresh stats
    const { data: arr } = await supabase.rpc("get_rating_stats", { p_anime_id: animeId });
    const s = Array.isArray(arr) ? arr[0] : arr;
    setStats((s as Stats) ?? { avg_rating: 0, ratings_count: 0 });

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
        {myRating && (
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

/** Simple 5-star average display (supports fractional fill) */
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
            {/* empty star */}
            <div className="absolute inset-0 text-slate-600">★</div>
            {/* filled or partial overlay */}
            <div
              className={`absolute inset-0 overflow-hidden ${
                filled || partial ? "" : "w-0"
              }`}
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
