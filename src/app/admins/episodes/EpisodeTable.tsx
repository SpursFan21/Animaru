//Animaru\src\app\admins\episodes\EpisodeTable.tsx

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteEpisodeAction } from "./actions";
import EpisodeForm from "./EpisodeForm";

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

export default function EpisodeTable({
  anime,
  initialEpisodes,
  subtitleOptions,
}: {
  anime: { id: string; title: string; slug: string };
  initialEpisodes: Episode[];
  subtitleOptions: string[];
}) {
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q
      ? episodes
      : episodes.filter((e) =>
          [e.title ?? "", String(e.number ?? ""), e.status ?? "", e.variant ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
  }, [episodes, query]);

  const supaPublicBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const coverUrl = (path: string | null) =>
    path ? `${supaPublicBase}/storage/v1/object/public/covers/${path}` : "";

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search number, title, status…"
          className="w-full md:w-96 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
        />
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-4 py-2 font-semibold"
        >
          New Episode
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-blue-900/50">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-950/40 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Variant</th>
              <th className="px-3 py-2 text-left">Duration</th>
              <th className="px-3 py-2 text-left">Thumb</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-blue-900/40">
                <td className="px-3 py-2 w-16">{e.number ?? "—"}</td>
                <td className="px-3 py-2">{e.title ?? "—"}</td>
                <td className="px-3 py-2">{e.status ?? "—"}</td>
                <td className="px-3 py-2">{e.variant ?? "—"}</td>
                <td className="px-3 py-2">{e.duration_seconds ?? "—"}</td>
                <td className="px-3 py-2">
                  {e.thumb_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl(e.thumb_path)}
                      alt=""
                      className="h-10 w-7 rounded object-cover border border-slate-700"
                    />
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing(e)}
                      className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
                    >
                      Edit
                    </button>

                    {/* tiny form button that calls the server action to delete */}
                    <form
                      action={async () => {
                        const res = await deleteEpisodeAction(e.id, anime.id);
                        if (res.ok) {
                          toast.success("Episode deleted");
                          setEpisodes((prev) => prev.filter((x) => x.id !== e.id));
                        } else {
                          toast.error(res.error ?? "Delete failed");
                        }
                      }}
                    >
                      <button className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  No episodes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* create */}
      {openCreate && (
        <EpisodeForm
          mode="create"
          anime={anime}
          subtitleOptions={subtitleOptions}
          onClose={() => setOpenCreate(false)}
          onSaved={() => {
            toast.success("Episode created");
            location.reload(); // simplest to re-pull server data (already revalidated)
          }}
        />
      )}

      {/* edit */}
      {editing && (
        <EpisodeForm
          mode="edit"
          anime={anime}
          episode={editing}
          subtitleOptions={subtitleOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            toast.success("Episode updated");
            location.reload();
          }}
        />
      )}
    </div>
  );
}
