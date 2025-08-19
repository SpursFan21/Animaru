//src\app\_components\AnimeModal.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/button";
import { ChevronDown, Check } from "lucide-react";

type Status = "watching" | "planned" | "completed" | "dropped";

export type AnimeForModal = {
  id: string;
  slug: string;
  title: string;
  synopsis?: string | null;
  cover_path?: string | null;
  banner_path?: string | null;
  genres?: string[] | null;
  season?: string | null;
  year?: number | null;
  episodes?: number | null;
  status?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  anime: AnimeForModal | null;
};

function publicUrl(bucket: "covers" | "banners", path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function AnimeModal({ open, onClose, anime }: Props) {
  const user = useSelector<RootState, User | null>((s) => s.auth.user);
  const userId = user?.id ?? null;

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC / click outside menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  // Reset flashes when opening
  useEffect(() => {
    if (open) {
      setMsg(null);
      setErr(null);
      setMenuOpen(false);
    }
  }, [open, anime?.id]);

  // Unconditional hooks
  const coverUrl = useMemo(() => publicUrl("covers", anime?.cover_path), [anime?.cover_path]);
  const bannerUrl = useMemo(() => publicUrl("banners", anime?.banner_path), [anime?.banner_path]);

  if (!open || !anime) return null;
  const a = anime;

  async function addToWatchlist(status: Status) {
    if (!userId) {
      setErr("Please log in to manage your watchlist.");
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase.from("watchlist").upsert(
        [
          {
            user_id: userId,
            anime_id: a.id,
            title: a.title ?? null,
            poster_url: coverUrl ?? null,
            status,
          },
        ],
        { onConflict: "user_id,anime_id" }
      );
      if (error) throw error;
      setMsg(`Added to "${labelFor(status)}".`);
      setMenuOpen(false);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Could not update watchlist.";
      setErr(m);
    } finally {
      setSaving(false);
    }
  }

  function labelFor(s: Status) {
    switch (s) {
      case "watching":
        return "Watching";
      case "planned":
        return "Plan to Watch";
      case "completed":
        return "Completed";
      case "dropped":
        return "Dropped";
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Wrapper: keep overflow visible so the dropdown can spill outside */}
      <div
        className="relative w-full max-w-[1000px] max-h-[90vh] overflow-visible rounded-2xl border border-blue-800 bg-blue-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner (only top corners rounded & clipped) */}
        <div className="relative h-64 md:h-80 rounded-t-2xl overflow-hidden">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt={a.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-950/50 to-transparent" />
        </div>

        {/* Scrollable content area INSIDE the card */}
        <div className="relative -mt-40 md:-mt-56 px-5 md:px-8 pb-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md border border-blue-800 bg-blue-900/70 px-2 py-1 text-sm text-slate-200 hover:bg-blue-800"
          >
            Close
          </button>

          <div className="flex gap-5">
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`${a.title} cover`}
                className="hidden md:block h-48 w-36 rounded-lg border border-blue-800 object-cover"
              />
            )}

            <div className="flex-1">
              <p className="text-xs text-slate-300/80 mb-1">#Spotlight</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">{a.title}</h2>

              {/* Meta chips */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                {(a.season ?? a.year) && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800">
                    {(a.season ? `${a.season} ` : "") + (a.year ?? "")}
                  </span>
                )}
                {typeof a.episodes === "number" && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800">
                    {a.episodes} ep
                  </span>
                )}
                {a.status && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800 capitalize">
                    {a.status}
                  </span>
                )}
                {a.genres?.length ? (
                  <span className="flex flex-wrap gap-1">
                    {a.genres.slice(0, 4).map((g) => (
                      <span key={g} className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800">
                        {g}
                      </span>
                    ))}
                  </span>
                ) : null}
              </div>

              {a.synopsis && (
                <p className="text-slate-300 max-w-2xl line-clamp-4 md:line-clamp-5">{a.synopsis}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={`/watch/${a.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
                >
                  Watch now
                </a>

                {/* Add to watchlist dropdown */}
                <div className="relative" ref={menuRef}>
                  <Button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 bg-blue-900/60 hover:bg-blue-900 border border-blue-800"
                    disabled={saving}
                  >
                    Add to watchlist
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {menuOpen && (
                    <div className="absolute z-[70] mt-2 w-56 overflow-hidden rounded-md border border-blue-800 bg-blue-900/95 shadow-xl backdrop-blur">
                      {(["watching", "planned", "completed", "dropped"] as Status[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => addToWatchlist(s)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-800"
                          disabled={saving}
                        >
                          <span className="capitalize">{labelFor(s)}</span>
                          {saving && <Check className="h-4 w-4 opacity-60" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flash messages */}
                {msg && <span className="text-emerald-300 text-sm">{msg}</span>}
                {err && <span className="text-red-300 text-sm">{err}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
