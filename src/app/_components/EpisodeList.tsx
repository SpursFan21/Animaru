//src\app\_components\EpisodeList.tsx

"use client";

import { useMemo } from "react";
import Image from "next/image";

export type Episode = {
  id: string;
  number: number;
  title: string | null;
  duration_seconds: number | null;
  playback_id: string | null;
  thumb_path: string | null; // should be an absolute URL or a path Image loader supports
};

type Props = {
  episodes: Episode[];
  currentId?: string | null;
  onSelect: (ep: Episode) => void;
};

function formatDuration(s?: number | null) {
  if (typeof s !== "number" || !Number.isFinite(s) || s < 0) return null;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}m ${ss}s`;
}

export default function EpisodeList({ episodes, currentId, onSelect }: Props) {
  const sorted = useMemo(
    () => [...episodes].sort((a, b) => a.number - b.number),
    [episodes]
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 shrink-0">
      <div className="rounded-xl border border-blue-800 bg-blue-900/40 p-3">
        <h3 className="text-lg font-semibold mb-2">Episodes</h3>
        <ul className="max-h-[70vh] overflow-y-auto pr-1 space-y-2">
          {sorted.map((ep) => {
            const active = ep.id === currentId;
            const duration = formatDuration(ep.duration_seconds);

            return (
              <li key={ep.id}>
                <button
                  className={[
                    "w-full flex items-center gap-3 rounded-md border px-2 py-2 text-left",
                    active
                      ? "border-sky-500 bg-sky-600/20"
                      : "border-blue-800 bg-blue-900/40 hover:border-sky-500",
                  ].join(" ")}
                  onClick={() => onSelect(ep)}
                >
                  {/* thumbnail */}
                  <div className="h-12 w-20 rounded-sm bg-blue-950/60 border border-blue-800 overflow-hidden relative">
                    {ep.thumb_path ? (
                      <Image
                        src={ep.thumb_path}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                        //
                        // keep unoptimized to avoid Next.js domain checks:
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      Ep {ep.number}
                      {ep.title ? ` – ${ep.title}` : ""}
                    </div>
                    {duration && (
                      <div className="text-xs text-slate-400">{duration}</div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
