//src\app\_components\AnimeModal.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import Link from "next/link";

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
  mode?: "add" | "manage";
  currentStatus?: Status;
  onRemoved?: () => void;
};

function publicUrl(bucket: "covers" | "banners", path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function AnimeModal({
  open,
  onClose,
  anime,
  mode = "add",
  currentStatus,
  onRemoved,
}: Props) {
  const user = useSelector<RootState, User | null>((s) => s.auth.user);
  const userId = user?.id ?? null;

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // NEW: track the user's existing status for this anime so we can show the checkmark
  const [activeStatus, setActiveStatus] = useState<Status | null>(currentStatus ?? null);

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

  // Reset flashes and sync initial status when opening
  useEffect(() => {
    if (open) {
      setMsg(null);
      setErr(null);
      setMenuOpen(false);
      setActiveStatus(currentStatus ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anime?.id]);

  // If open the modal from a non-watchlist context (mode="add"),
  // auto-detect if the user already has this anime in a list and show the checkmark.
  useEffect(() => {
    if (!open || !anime || !userId || mode !== "add") return;
    let mounted = true;

    void (async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("status")
        .eq("user_id", userId)
        .eq("anime_id", anime.id)
        .limit(1)
        .returns<{ status: Status }[]>();   // <- type the payload

      if (!mounted) return;
      if (!error && data?.[0]?.status) setActiveStatus(data[0].status);
    })();

    return () => {
      mounted = false;
    };
  }, [open, anime, userId, mode]);


  const coverUrl = useMemo(() => publicUrl("covers", anime?.cover_path), [anime?.cover_path]);
  const bannerUrl = useMemo(() => publicUrl("banners", anime?.banner_path), [anime?.banner_path]);

  if (!open || !anime) return null;
  const a = anime;

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

  async function upsertWatchlist(status: Status) {
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
      setMsg(`${mode === "add" ? "Added to" : "Updated to"} "${labelFor(status)}".`);
      setActiveStatus(status); // reflect in UI
      setMenuOpen(false);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Could not update watchlist.";
      setErr(m);
    } finally {
      setSaving(false);
    }
  }

  async function removeFromWatchlist() {
    if (!userId) {
      setErr("Please log in to manage your watchlist.");
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("anime_id", a.id);
      if (error) throw error;
      setMsg("Removed from watchlist.");
      setActiveStatus(null); // no current status anymore
      setMenuOpen(false);
      onRemoved?.();
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Could not remove from watchlist.";
      setErr(m);
    } finally {
      setSaving(false);
    }
  }

  const buttonLabel = mode === "manage" ? "Update watchlist" : "Add to watchlist";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[1000px] max-h-[90vh] overflow-visible rounded-2xl border border-blue-800 bg-blue-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-64 md:h-80 rounded-t-2xl overflow-hidden">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt={a.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-950/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative -mt-40 md:-mt-56 px-5 md:px-8 pb-8">
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

              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                {activeStatus && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800 capitalize">
                    Current: {activeStatus}
                  </span>
                )}
                {(a.season ?? a.year) && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800">
                    {(a.season ? `${a.season} ` : "") + (a.year ?? "")}
                  </span>
                )}
                {typeof a.episodes === "number" && (
                  <span className="rounded bg-blue-900/60 px-2 py-1 border border-blue-800">{a.episodes} ep</span>
                )}
              </div>

              {a.synopsis && (
                <p className="text-slate-300 max-w-2xl line-clamp-4 md:line-clamp-5">{a.synopsis}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/anime/${a.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
                >
                  Watch now
                </Link>

                {/* Watchlist dropdown */}
                <div className="relative" ref={menuRef}>
                  <Button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 bg-blue-900/60 hover:bg-blue-900 border border-blue-800"
                    disabled={saving}
                  >
                    {buttonLabel}
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {menuOpen && (
                    <div className="absolute z-[70] mt-2 w-56 overflow-hidden rounded-md border border-blue-800 bg-blue-900/95 shadow-xl backdrop-blur">
                      {(["watching", "planned", "completed", "dropped"] as Status[]).map((s) => {
                        const isActive = activeStatus === s;
                        return (
                          <button
                            key={s}
                            onClick={() => upsertWatchlist(s)}
                            className={[
                              "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-800",
                              isActive ? "bg-blue-800/50" : "",
                            ].join(" ")}
                            disabled={saving}
                          >
                            <span className="capitalize">{labelFor(s)}</span>
                            {isActive ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}

                      {mode === "manage" && (
                        <>
                          <div className="h-px bg-blue-800 my-1" />
                          <button
                            onClick={removeFromWatchlist}
                            className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-blue-800"
                            disabled={saving}
                          >
                            Remove from watchlist
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

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
