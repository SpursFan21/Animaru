//Animaru\src\app\watchlists\page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabaseClient";
import AnimeModal, { type AnimeForModal } from "../_components/AnimeModal";

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
  genre?: string | null;
  platform?: string | null;
  release_date?: string | null;
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

  // UI
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Data
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnime, setModalAnime] = useState<AnimeForModal | null>(null);
  const [modalStatus, setModalStatus] = useState<Status | undefined>(undefined);

  // Require login
  useEffect(() => {
    if (user === null) {
      sessionStorage.setItem("redirect-to", "/watchlists");
      router.replace("/login");
    }
  }, [user, router]);

  // Load list (typed & immutable query to avoid any-assign warnings)
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const orderField = sortBy === "alpha" ? "title" : "updated_at";
        const orderOpts =
          sortBy === "alpha"
            ? ({ ascending: true, nullsFirst: true } as const)
            : ({ ascending: false } as const);

        const base = supabase
          .from("watchlist")
          .select(
            "id, user_id, anime_id, title, poster_url, status, progress_episode, progress_time_seconds, created_at, updated_at"
          )
          .eq("user_id", userId);

        const query =
          status === "all"
            ? base.order(orderField, orderOpts)
            : base.eq("status", status).order(orderField, orderOpts);

        const { data, error } = await query.returns<WatchlistRow[]>();
        if (error) throw error;
        if (!mounted) return;

        setRows(data ?? []);
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

  // Filters
  const counts = useMemo(() => {
    const base = { all: rows.length, watching: 0, planned: 0, completed: 0, dropped: 0 } as Record<
      StatusFilter,
      number
    >;
    for (const r of rows) base[r.status] += 1;
    return base;
  }, [rows]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (genreFilter !== "all" && (r.genre ?? "").toLowerCase() !== genreFilter.toLowerCase()) return false;
      if (platformFilter !== "all" && (r.platform ?? "").toLowerCase() !== platformFilter.toLowerCase()) return false;
      if (q && !(r.title ?? r.anime_id).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, genreFilter, platformFilter]);

  const visible = useMemo(() => {
    if (sortBy !== "release") return filtered;
    return [...filtered].sort((a, b) => {
      const da = a.release_date ? Date.parse(a.release_date) : NaN;
      const db = b.release_date ? Date.parse(b.release_date) : NaN;
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return db - da;
    });
  }, [filtered, sortBy]);

  // Open modal for a given row (typed anime fetch)
  async function openModalFor(row: WatchlistRow) {
    type AnimeMini = {
      id: string;
      slug: string;
      title: string;
      synopsis: string | null;
      cover_path: string | null;
      banner_path: string | null;
      episodes: number | null;
      season: string | null;
      year: number | null;
    };

    const { data, error } = await supabase
      .from("anime")
      .select("id, slug, title, synopsis, cover_path, banner_path, episodes, season, year")
      .eq("id", row.anime_id)
      .limit(1)
      .returns<AnimeMini[]>();

    if (error || !data?.[0]) {
      // fallback if not found; still show with minimal info
      setModalAnime({
        id: row.anime_id,
        slug: row.anime_id, // fallback; Watch now may not work if truly missing
        title: row.title ?? "Unknown",
      });
    } else {
      const a = data[0];
      setModalAnime({
        id: a.id,
        slug: a.slug,
        title: a.title,
        synopsis: a.synopsis,
        cover_path: a.cover_path,
        banner_path: a.banner_path,
        episodes: a.episodes,
        season: a.season,
        year: a.year,
      });
    }
    setModalStatus(row.status);
    setModalOpen(true);
  }

  return (
    <div className="min-h-[80vh] bg-blue-950 text-slate-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4">Your Watchlist</h1>

        {/* Tabs */}
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

        {/* Toolbar */}
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

        {/* Cards (click to open modal) */}
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
                <li
                  key={r.id}
                  className="rounded-lg border border-blue-800 bg-blue-900/40 p-3 cursor-pointer hover:border-sky-500 transition"
                  onClick={() => void openModalFor(r)}
                >
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Manage modal */}
      <AnimeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        anime={modalAnime}
        mode="manage"
        currentStatus={modalStatus}
        onRemoved={() => {
          if (!modalAnime) return;
          setRows((prev) => prev.filter((x) => x.anime_id !== modalAnime.id));
          setModalOpen(false);
        }}
      />
    </div>
  );
}
