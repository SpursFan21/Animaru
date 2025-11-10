//Animaru\src\app\admins\episodes\EpisodeTable.tsx

"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";
import {
  createEpisodeAction,
  updateEpisodeAction,
  deleteEpisodeAction,
} from "./actions";

type Episode = {
  id: string;
  anime_id: string;
  anime_title: string | null;
  number: number;
  title: string | null;
  synopsis: string | null;
  season: number | null;
  air_date: string | null;
  duration_seconds: number | null;
  asset_id: string | null;
  playback_id: string | null;
  thumb_path: string | null;
  captions: string[] | null; // jsonb array
  status: string | null;
  variant: string | null;
};

function SubmitBtn({ label, saving = "Saving…" }: { label: string; saving?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold"
    >
      {pending ? saving : label}
    </button>
  );
}

export default function EpisodeTable({
  anime,
  initialEpisodes,
  subtitleFiles,
}: {
  anime: { id: string; title: string; slug: string | null };
  initialEpisodes: Episode[];
  subtitleFiles: string[];
}) {
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return episodes;
    return episodes.filter((e) =>
      [e.title ?? "", String(e.number ?? ""), e.status ?? "", e.variant ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, episodes]);

  // optimistic refresh on success
  function refreshAfter(ok: boolean, msg: string) {
    if (ok) {
      toast.success(msg);
      location.reload(); // simplest reliable refresh w/ actions
    } else {
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by number/title/status…"
          className="w-full md:w-96 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
        />
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2 font-semibold"
        >
          New Episode
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-blue-900/40">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-950/40 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Season</th>
              <th className="px-3 py-2 text-left">Air</th>
              <th className="px-3 py-2 text-left">Dur</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Mux</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-blue-900/30">
                <td className="px-3 py-2">{e.number}</td>
                <td className="px-3 py-2">{e.title}</td>
                <td className="px-3 py-2">{e.season ?? "—"}</td>
                <td className="px-3 py-2">{e.air_date ?? "—"}</td>
                <td className="px-3 py-2">{e.duration_seconds ?? "—"}</td>
                <td className="px-3 py-2">{e.status ?? "—"}</td>
                <td className="px-3 py-2">
                  {e.playback_id ? (
                    <code className="text-xs">{e.playback_id}</code>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 mr-2"
                    onClick={() => setEditing(e)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500"
                    onClick={async () => {
                      const res = await deleteEpisodeAction(e.id, e.anime_id);
                      refreshAfter(res.ok, res.ok ? "Episode deleted" : res.error || "Delete failed");
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-slate-400" colSpan={8}>
                  No episodes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {openCreate && (
        <EpisodeModal
          mode="create"
          anime={anime}
          subtitleFiles={subtitleFiles}
          onClose={() => setOpenCreate(false)}
          onDone={(ok, msg) => refreshAfter(ok, msg)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <EpisodeModal
          mode="edit"
          anime={anime}
          subtitleFiles={subtitleFiles}
          episode={editing}
          onClose={() => setEditing(null)}
          onDone={(ok, msg) => refreshAfter(ok, msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Modal (Create/Edit) ---------------- */

function EpisodeModal({
  mode,
  anime,
  subtitleFiles,
  episode,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  anime: { id: string; title: string; slug: string | null };
  subtitleFiles: string[];
  episode?: Episode;
  onClose: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [subs, setSubs] = useState<string[]>(
    episode?.captions ?? []
  );

  useEffect(() => {
    if (!result) return;
    if (result.ok) onDone(true, mode === "create" ? "Episode created" : "Episode updated");
    else onDone(false, result.error ?? "Action failed");
  }, [result]); // eslint-disable-line

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      let res;
      if (mode === "create") res = await createEpisodeAction(null, formData);
      else res = await updateEpisodeAction(null, formData);
      setResult(res);
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(980px,92vw)] rounded-2xl border border-blue-900/60 bg-blue-950/80 backdrop-blur-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {mode === "create" ? "New Episode" : `Edit Episode #${episode?.number}`}
          </h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-slate-300 hover:bg-slate-800">
            Close
          </button>
        </div>

        <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* hidden ids / meta */}
          <input type="hidden" name="anime_id" defaultValue={anime.id} />
          <input type="hidden" name="anime_title" defaultValue={anime.title} />
          <input type="hidden" name="anime_slug" defaultValue={anime.slug ?? ""} />
          {mode === "edit" && <input type="hidden" name="id" defaultValue={episode!.id} />}

          {/* LEFT */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Episode #</label>
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
                  name="air_date"
                  type="date"
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
                <input
                  name="status"
                  defaultValue={episode?.status ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                  placeholder="public | unlisted | draft"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Variant</label>
                <input
                  name="variant"
                  defaultValue={episode?.variant ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                  placeholder="sub | dub | etc"
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Episode Cover (bucket: covers)</label>
              <input type="file" name="cover" accept="image/*" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" />
              <p className="mt-1 text-xs text-slate-400">Saved to <code>covers</code> as <code>{(anime.slug ?? "episode")}-e&lt;number&gt;.ext</code></p>
              {episode?.thumb_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${episode.thumb_path}`}
                  alt="current cover"
                  className="mt-2 h-24 w-16 rounded-md object-cover border border-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Video (upload to Mux)</label>
              <input type="file" name="video" accept="video/*" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" />
              {episode?.playback_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Current playback_id: <code>{episode.playback_id}</code>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Captions (from subtitles bucket)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {subs.map((s) => (
                  <span key={s} className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1">
                    {s} <button className="ml-1 text-rose-400" onClick={(e) => { e.preventDefault(); setSubs(subs.filter((x) => x !== s)); }}>×</button>
                  </span>
                ))}
              </div>
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && !subs.includes(v)) setSubs([...subs, v]);
                }}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                defaultValue=""
              >
                <option value="" disabled>Select subtitle to add…</option>
                {subtitleFiles.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {/* hidden field to send comma string */}
              <input type="hidden" name="subtitle_paths" value={subs.join(",")} />
            </div>

            <div className="pt-2">
              <SubmitBtn label={mode === "create" ? "Create Episode" : "Save Changes"} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
