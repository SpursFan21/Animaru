//Animaru\src\app\admins\popular\PopularManagerClient.tsx

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { addPopularAction, removePopularAction, setPopularOrderAction } from "./actions";
import type { PopularItem } from "./actions";


type Candidate = {
  id: string;
  slug: string | null;
  title: string;
  cover_path: string | null;
  season: string | null;
  year: number | null;
};

const supaBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const coverUrl = (p: string | null | undefined) =>
  p ? `${supaBase}/storage/v1/object/public/covers/${p}` : "";

function OrderSelect({
  value,
  onChange,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-md bg-slate-900/70 border border-slate-700 px-2 text-sm"
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}

export default function PopularManagerClient({
  initialRotation,
  candidates,
}: {
  initialRotation: PopularItem[];
  candidates: Candidate[];
}) {
  const [rotation, setRotation] = useState<PopularItem[]>(initialRotation);

  const idsInRotation = new Set(rotation.map((r) => r.anime?.id));
  const freeSlots = Math.max(0, 10 - rotation.length);

  const available = useMemo(
    () => candidates.filter((c) => !!c.cover_path && !idsInRotation.has(c.id)),
    [candidates, rotation]
  );

  const onAdd = async (animeId: string) => {
    const res = await addPopularAction(animeId);
    if (!res.ok) return toast.error(res.error ?? "Failed to add");
    toast.success("Added to Popular rotation");
    // optimistic: just reload page via location? or refetch? quick workaround:
    location.reload();
  };

  const onRemove = async (rowId: string) => {
    const res = await removePopularAction(rowId);
    if (!res.ok) return toast.error(res.error ?? "Failed to remove");
    toast.success("Removed");
    location.reload();
  };

  const onReorder = async (rowId: string, pos: number) => {
    const res = await setPopularOrderAction(rowId, pos);
    if (!res.ok) return toast.error(res.error ?? "Order conflict");
    toast.success("Order updated");
    location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Rotation (up to 10) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Rotation (1–10)</h2>
          <div className="text-sm text-slate-400">{rotation.length}/10 filled</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {rotation.map((r) => (
            <div key={r.id} className="rounded-xl border border-blue-900/50 bg-blue-950/40 overflow-hidden">
              <div className="relative h-28 bg-slate-900">
                {r.anime?.cover_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl(r.anime.cover_path)} alt={r.anime?.title ?? ""} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-400">Order</div>
                  <OrderSelect value={r.order_pos} onChange={(v) => onReorder(r.id, v)} max={10} />
                </div>
                <div className="font-medium truncate">{r.anime?.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {(r.anime?.season ?? "—")} {r.anime?.year ?? ""}
                </div>

                <button
                  onClick={() => onRemove(r.id)}
                  className="mt-3 w-full rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-2 text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: freeSlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 grid place-items-center h-[168px]"
            >
              <span className="text-slate-500 text-sm">Empty</span>
            </div>
          ))}
        </div>
      </section>

      {/* Candidates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">All anime with covers</h2>
          <div className="text-sm text-slate-400">{freeSlots} free slot(s)</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {available.map((a) => (
            <div key={a.id} className="rounded-xl border border-blue-900/50 bg-blue-950/40 overflow-hidden">
              <div className="relative h-28 bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl(a.cover_path)} alt={a.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="font-medium truncate">{a.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {(a.season ?? "—")} {a.year ?? ""}
                </div>
                <button
                  disabled={freeSlots === 0}
                  onClick={() => onAdd(a.id)}
                  className="mt-3 w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm font-semibold"
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
