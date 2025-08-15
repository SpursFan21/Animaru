//Animaru\src\app\watchlists\page.tsx


"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/button";

type Status = "watching" | "planned" | "completed" | "dropped";
type StatusFilter = Status | "all";

type WatchlistRow = {
  id: string;
  user_id: string;
  anime_id: string;
  title: string | null;
  poster_url: string | null;
  status: Status;
  progress_episode: number | null;
  progress_time_seconds: number | null;
  created_at: string | null;
  updated_at: string | null;
};

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: "Watching" },
  { key: "planned", label: "Plan to Watch" },
  { key: "completed", label: "Completed" },
  { key: "dropped", label: "Dropped" },
];

export default function WatchlistPage() {
  const router = useRouter();
  const user = useSelector<RootState, User | null>((s) => s.auth.user);
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Require login
  useEffect(() => {
    if (user === null) {
      sessionStorage.setItem("redirect-to", "/watchlist");
      router.replace("/login");
    }
  }, [user, router]);

  // Load list
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        let q = supabase
          .from("watchlist")
          .select(
            "id, user_id, anime_id, title, poster_url, status, progress_episode, progress_time_seconds, created_at, updated_at",
          )
          .eq("user_id", userId);

        if (status !== "all") q = q.eq("status", status);

        const { data, error } = await q.order("updated_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        setRows((data ?? []) as WatchlistRow[]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load watchlist.";
        setErr(msg ?? "Failed to load watchlist.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [userId, status]);

  // Counts per tab (computed from loaded rows when on "all")
  const counts = useMemo(() => {
    const base = { all: rows.length, watching: 0, planned: 0, completed: 0, dropped: 0 } as Record<
      StatusFilter,
      number
    >;
    for (const r of rows) {
      base[r.status] += 1;
    }
    return base;
  }, [rows]);

  // Helpers (add/update/remove) — call these from item cards or detail pages later
  async function addToWatchlist(payload: {
    anime_id: string;
    title?: string;
    poster_url?: string;
    status?: Status;
  }) {
    if (!userId) return;
    const { error } = await supabase.from("watchlist").upsert(
      [
        {
          user_id: userId,
          anime_id: payload.anime_id,
          title: payload.title ?? null,
          poster_url: payload.poster_url ?? null,
          status: payload.status ?? "planned",
        },
      ],
      { onConflict: "user_id,anime_id" },
    );
    if (error) throw error;
  }

  async function updateStatus(anime_id: string, next: Status) {
    if (!userId) return;
    const { error } = await supabase
      .from("watchlist")
      .update({ status: next })
      .eq("user_id", userId)
      .eq("anime_id", anime_id);
    if (error) throw error;
  }

  async function removeFromWatchlist(anime_id: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("anime_id", anime_id);
    if (error) throw error;
  }

  // UI
  return (
    <div className="min-h-[80vh] bg-blue-950 text-slate-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4">Your Watchlist</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((t) => {
            const active = status === t.key;
            const count =
              t.key === "all" ? counts.all : (counts[t.key] ?? 0);
            return (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={[
                  "px-3 py-1.5 rounded-md border",
                  active
                    ? "bg-sky-600 border-sky-500 text-white"
                    : "bg-blue-900/40 border-blue-800 hover:border-sky-500",
                ].join(" ")}
              >
                {t.label}
                <span className="ml-2 text-xs opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-blue-900/50 border border-blue-800 shadow-xl p-4">
          {err && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          {loading ? (
            <p className="text-slate-300">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-slate-300">No titles in this section yet.</p>
          ) : (
            <ul className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {rows.map((r) => (
                <li key={r.id} className="rounded-lg border border-blue-800 bg-blue-900/40 p-3">
                  {r.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.poster_url}
                      alt={r.title ?? r.anime_id}
                      className="w-full h-64 object-cover rounded-md mb-2"
                    />
                  ) : (
                    <div className="w-full h-64 bg-blue-950/60 rounded-md mb-2 grid place-items-center text-slate-400">
                      No image
                    </div>
                  )}
                  <div className="font-semibold line-clamp-2">{r.title ?? r.anime_id}</div>
                  <div className="text-xs text-slate-400 mt-1 capitalize">{r.status}</div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      className="bg-sky-600 hover:bg-sky-500"
                      onClick={async () => {
                        await updateStatus(r.anime_id, "watching");
                        setRows((prev) =>
                          prev.map((x) =>
                            x.anime_id === r.anime_id ? { ...x, status: "watching" } : x,
                          ),
                        );
                      }}
                    >
                      Move to Watching
                    </Button>
                    <Button
                      variant="secondary"
                      className="border-blue-800"
                      onClick={async () => {
                        await removeFromWatchlist(r.anime_id);
                        setRows((prev) => prev.filter((x) => x.anime_id !== r.anime_id));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Example: add dummy item (replace with real “Add to Watchlist” buttons elsewhere) */}
        <div className="mt-6">
          <Button
            className="bg-sky-600 hover:bg-sky-500"
            onClick={async () => {
              // Example: upsert a fake anime
              await addToWatchlist({
                anime_id: "demo-123",
                title: "Demo Anime",
                poster_url: "",
                status: "planned",
              });
              // Refresh current view
              setStatus((s) => s); // re-trigger effect
            }}
          >
            Add Demo Item
          </Button>
        </div>
      </div>
    </div>
  );
}
