// src/app/admins/episodes/EpisodeForm.tsx

"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createEpisodeAction, updateEpisodeAction } from "./actions";

type Episode = {
  id: string;
  anime_id: string;
  number: number | null;
  title: string | null;
  synopsis: string | null;
  season: number | null;
  air_date: string | null;
  duration_seconds: number | null;
  status: string | null;
  variant: string | null;
  captions: string[] | null;
  thumb_path: string | null;
  asset_id: string | null;
  playback_id: string | null;
};

function SubmitButton({ label }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold"
    >
      {pending ? "Saving…" : label ?? "Save"}
    </button>
  );
}

export default function EpisodeForm({
  mode,
  anime,
  episode,
  subtitleOptions,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  anime: { id: string; title: string; slug: string };
  episode?: Episode;
  subtitleOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subs, setSubs] = useState<string[]>(episode?.captions ?? []);

  const [result, action] = useActionState(
    mode === "create" ? createEpisodeAction : updateEpisodeAction,
    null as any
  );

  // react to server result
  useEffect(() => {
    if (!result) return;
    if (result.ok) onSaved();
    else toast.error(result.error ?? "Failed to save episode");
  }, [result, onSaved]);

  const titleText =
    mode === "create" ? `New episode for “${anime.title}”` : `Edit episode: ${episode?.title ?? ""}`;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* panel */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(980px,92vw)] rounded-2xl border border-blue-900/60 bg-blue-950/80 backdrop-blur-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{titleText}</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-slate-300 hover:bg-slate-800">
            Close
          </button>
        </div>

        <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* hidden meta */}
          <input type="hidden" name="anime_id" defaultValue={anime.id} />
          <input type="hidden" name="anime_title" defaultValue={anime.title} />
          <input type="hidden" name="anime_slug" defaultValue={anime.slug} />
          {mode === "edit" && <input type="hidden" name="id" defaultValue={episode?.id} />}

          {/* LEFT */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Number *</label>
                <input
                  name="number"
                  required
                  defaultValue={episode?.number ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Season</label>
                <input
                  name="season"
                  defaultValue={episode?.season ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                name="title"
                required
                defaultValue={episode?.title ?? ""}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                placeholder="Episode title"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Synopsis</label>
              <textarea
                name="synopsis"
                rows={6}
                defaultValue={episode?.synopsis ?? ""}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Air date</label>
                <input
                  type="date"
                  name="air_date"
                  defaultValue={episode?.air_date ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Duration (sec)</label>
                <input
                  name="duration_seconds"
                  defaultValue={episode?.duration_seconds ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={episode?.status ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Variant</label>
                <input
                  name="variant"
                  defaultValue={episode?.variant ?? ""}
                  placeholder="sub / dub / director-cut…"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Thumbnail (covers bucket)</label>
              <input
                type="file"
                name="cover"
                accept="image/*"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Saved as <code>{anime.slug}-e&lt;number&gt;.&lt;ext&gt;</code> in the <code>covers</code> bucket.
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">Subtitles (select & add)</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !subs.includes(val)) setSubs((s) => [...s, val]);
                    e.currentTarget.selectedIndex = 0;
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a .vtt from subtitles bucket…
                  </option>
                  {subtitleOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSubs([])}
                  className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3"
                >
                  Clear
                </button>
              </div>

              {subs.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {subs.map((s) => (
                    <li key={s} className="flex items-center justify-between">
                      <span className="font-mono">{s}</span>
                      <button
                        type="button"
                        className="text-rose-400 hover:underline"
                        onClick={() => setSubs((prev) => prev.filter((x) => x !== s))}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* send as comma-separated string */}
              <input type="hidden" name="subtitle_paths" value={subs.join(",")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Mux Asset ID</label>
                <input
                  name="asset_id"
                  defaultValue={episode?.asset_id ?? ""}
                  placeholder="(paste from Mux dashboard, optional)"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Mux Playback ID</label>
                <input
                  name="playback_id"
                  defaultValue={episode?.playback_id ?? ""}
                  placeholder="(paste from Mux dashboard, optional)"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton label={mode === "create" ? "Create Episode" : "Save Changes"} />
              {result?.error && (
                <div className="mt-2 text-sm text-rose-400 bg-rose-950/30 border border-rose-800 rounded-lg p-3">
                  {result.error}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
