//Animaru\src\app\admins\banners\BannerManagerClient.tsx

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addAnimeToSlotAction,
  removeSlotAction,
  setSlotOrderAction,
  type BannerSlotRow,
} from "./actions";

type AnimeRow = {
  id: string;
  title: string;
  slug: string | null;
  banner_path: string | null;
  season: string | null;
  year: number | null;
};

export default function BannerManagerClient({
  initialSlots,
  eligibleAnime,
}: {
  initialSlots: BannerSlotRow[];
  eligibleAnime: AnimeRow[];
}) {
  const [slots, setSlots] = useState(initialSlots);

  const supaBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bannerUrl = (p: string | null) =>
    p ? `${supaBase}/storage/v1/object/public/banners/${p}` : "";

  // Build a quick lookup of slot by order (1..5)
  const byOrder = useMemo(() => {
    const map: Record<number, BannerSlotRow | undefined> = {};
    for (const s of slots) map[s.sort_order] = s;
    return map;
  }, [slots]);

  async function removeSlot(slotId: string) {
    const res = await removeSlotAction(slotId);
    if (res.ok) {
      toast.success("Removed from banner rotation");
      setSlots((s) => s.filter((r) => r.id !== slotId));
    } else {
      toast.error(res.error ?? "Failed to remove");
    }
  }

  async function addAnime(animeId: string) {
    const res = await addAnimeToSlotAction(animeId);
    if (res.ok) {
      toast.success("Added to banner rotation");
      // Trigger a soft refresh by re-calling list on the server would be ideal,
      // but for now just force reload. You already have SSR on page load anyway.
      window.location.reload();
    } else {
      toast.error(res.error ?? "Failed to add");
    }
  }

  async function changeOrder(slotId: string, newOrder: number) {
    const res = await setSlotOrderAction(slotId, newOrder);
    if (res.ok) {
      toast.success("Order updated");
      window.location.reload();
    } else {
      toast.error(res.error ?? "Failed to reorder");
    }
  }

  // how many free slots remain
  const usedOrders = new Set(slots.map((s) => s.sort_order));
  const freeCount = 5 - usedOrders.size;

  return (
    <div className="space-y-8">
      {/* TOP: five-slot manager */}
      <section className="rounded-2xl border border-blue-900/50 bg-blue-950/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Rotation (1–5)</h3>
          <p className="text-sm text-slate-400">
            {slots.length}/5 filled
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((o) => {
            const slot = byOrder[o];
            return (
              <div
                key={o}
                className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden"
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400">Order</div>
                  {slot ? (
                    <select
                      value={slot.sort_order}
                      onChange={(e) => changeOrder(slot.id, Number(e.target.value))}
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-slate-500">Empty</div>
                  )}
                </div>

                <div className="h-24 bg-slate-800">
                  {slot?.anime?.banner_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bannerUrl(slot.anime.banner_path)}
                      alt={slot.anime.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-slate-500 text-xs">
                      No banner
                    </div>
                  )}
                </div>

                <div className="p-2">
                  {slot?.anime ? (
                    <>
                      <div className="text-sm font-medium truncate">{slot.anime.title}</div>
                      <div className="text-xs text-slate-400">
                        {slot.anime.season ?? "—"} {slot.anime.year ?? ""}
                      </div>
                      <button
                        onClick={() => removeSlot(slot.id)}
                        className="mt-2 w-full rounded-md bg-rose-600/90 hover:bg-rose-600 px-3 py-1.5 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM: list of all anime that have banners */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">All anime with banners</h3>
          <div className="text-sm text-slate-400">
            {freeCount > 0 ? `${freeCount} free slot(s)` : "All 5 slots filled"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {eligibleAnime.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-blue-900/40 bg-blue-950/30 overflow-hidden"
            >
              <div className="h-24 bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl(a.banner_path)}
                  alt={a.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs text-slate-400">
                    {a.season ?? "—"} {a.year ?? ""}
                  </div>
                </div>
                <button
                  disabled={freeCount === 0}
                  onClick={() => addAnime(a.id)}
                  className="rounded-md bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-400 px-3 py-1.5 text-sm font-semibold"
                >
                  Add to rotation
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
