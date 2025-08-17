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
type SortBy = "recent" | "alpha" | "release";

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
  // Optional extra metadata (use later if these are added to columns)
  genre?: string | null;
  platform?: string | null;
  release_date?: string | null; // ISO string if you add it later
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

  // UI state
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // data state
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Require login
  useEffect(() => {
    if (user === null) {
      sessionStorage.setItem("redirect-to", "/watchlists");
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
        // Base query
        // NOTE: we only select columns we KNOW exist. (genre/platform/release_date are optional later)
        let q = supabase
          .from("watchlist")
          .select(
            "id, user_id, anime_id, title, poster_url, status, progress_episode, progress_time_seconds, created_at, updated_at"
          )
          .eq("user_id", userId);

        if (status !== "all") q = q.eq("status", status);

        // Server-side ordering for stable fields
        if (sortBy === "alpha") {
          q = q.order("title", { ascending: true, nullsFirst: true }).order("updated_at", { ascending: false });
        } else {
          // "recent" default – updated_at desc
          q = q.order("updated_at", { ascending: false });
        }

        const { data, error } = await q;
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
  }, [userId, status, sortBy]);

  // Unique genre/platform options from loaded rows (only if present)
  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (typeof r.genre === "string" && r.genre.trim()) set.add(r.genre.trim());
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const platformOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (typeof r.platform === "string" && r.platform.trim()) set.add(r.platform.trim());
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  // Counts per tab (computed from loaded rows when on "all")
  const counts = useMemo(() => {
    const base = {
      all: rows.length,
      watching: 0,
      planned: 0,
      completed: 0,
      dropped: 0,
    } as Record<StatusFilter, number>;
    for (const r of rows) base[r.status] += 1;
    return base;
  }, [rows]);

  // Client filters: search, genre, platform
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (genreFilter !== "all" && (r.genre ?? "").toLowerCase() !== genreFilter.toLowerCase()) return false;
      if (platformFilter !== "all" && (r.platform ?? "").toLowerCase() !== platformFilter.toLowerCase())
        return false;
      if (q && !(r.title ?? r.anime_id).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, genreFilter, platformFilter]);

  // Client sort for "release" (fall back if you don’t have that column yet)
  const visible = useMemo(() => {
    if (sortBy !== "release") return filtered;

    return [...filtered].sort((a, b) => {
      const da = a.release_date ? Date.parse(a.release_date) : NaN;
      const db = b.release_date ? Date.parse(b.release_date) : NaN;
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1; // NaNs last
      if (isNaN(db)) return -1;
      return db - da; // newest first
    });
  }, [filtered, sortBy]);

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
      { onConflict: "user_id,anime_id" }
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
    const { error } = await supabase.from("watchlist").delete().eq("user_id", userId).eq("anime_id", anime_id);
    if (error) throw error;
  }

  return (
    <div className="min-h-[80vh] bg-blue-950 text-slate-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4">Your Watchlist</h1>

        {/* Tabs (Status) */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((t) => {
            const active = status === t.key;
            const count = t.key === "all" ? counts.all : counts[t.key] ?? 0;
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

        {/* Toolbar: Search, Genre, Platform, Sort */}
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles…"
            className="rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2 outline-none placeholder:text-slate-400"
          />
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2 outline-none"
          >
            {genreOptions.map((g) => (
              <option key={g} value={g}>
                {g === "all" ? "All Genres" : g}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2 outline-none"
          >
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? "All Platforms" : p}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2 outline-none"
          >
            <option value="recent">Recently Added</option>
            <option value="alpha">A–Z</option>
            <option value="release">Release Date</option>
          </select>
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
          ) : visible.length === 0 ? (
            <p className="text-slate-300">No titles match your filters.</p>
          ) : (
            <ul className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {visible.map((r) => (
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
                  {r.genre && <div className="text-xs text-slate-400 mt-0.5">Genre: {r.genre}</div>}
                  {r.platform && <div className="text-xs text-slate-400 mt-0.5">Platform: {r.platform}</div>}
                  {r.release_date && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Released: {new Date(r.release_date).toLocaleDateString()}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      className="bg-sky-600 hover:bg-sky-500"
                      onClick={async () => {
                        await updateStatus(r.anime_id, "watching");
                        // optimistic
                        setRows((prev) =>
                          prev.map((x) => (x.anime_id === r.anime_id ? { ...x, status: "watching" } : x))
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
                        // optimistic
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
              await addToWatchlist({
                anime_id: "demo-123",
                title: "Demo Anime",
                poster_url: "",
                status: "planned",
              });
              // quick refresh
              setSortBy((s) => s);
            }}
          >
            Add Demo Item
          </Button>
        </div>
      </div>
    </div>
  );
}