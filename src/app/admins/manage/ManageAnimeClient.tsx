//Animaru\src\app\admins\manage\ManageAnimeClient.tsx

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";
import { updateAnimeAction } from "./actions";

type AnimeRow = {
  id: string;
  slug: string | null;
  title: string;
  season: string | null;
  year: number | null;
  episodes: number | null;
  status: string | null;
  cover_path: string | null;
  banner_path: string | null;
  synopsis: string | null;
  genres: string[] | null;
  anilist_id: number | null;
  mal_id: number | null;
};

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold"
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export default function ManageAnimeClient({
  initialAnimes,
}: {
  initialAnimes: AnimeRow[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnimeRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return initialAnimes;
    return initialAnimes.filter((a) =>
      [a.title, a.slug ?? "", a.status ?? "", a.season ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [query, initialAnimes]);

  const supaPublicBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const coverUrl = (path: string | null) =>
    path ? `${supaPublicBase}/storage/v1/object/public/covers/${path}` : "";

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, slug, season, status…"
          className="w-full md:w-96 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setEditing(a);
              setOpen(true);
            }}
            className="group rounded-xl border border-blue-900/40 bg-blue-950/30 hover:bg-blue-950/50 text-left overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              <div className="h-20 w-14 flex-shrink-0 rounded-md bg-slate-800 overflow-hidden">
                {a.cover_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl(a.cover_path)}
                    alt={a.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-xs text-slate-400">
                    No cover
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{a.title}</div>
                <div className="text-xs text-slate-400">
                  {a.season ?? "—"} {a.year ?? ""} • {a.status ?? "—"} •{" "}
                  {a.episodes ?? "?"} ep
                </div>
                <div className="text-xs text-slate-500 truncate">{a.slug}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {open && editing && (
        <EditModal
          anime={editing}
          onClose={() => setOpen(false)}
          onSaved={(msg) => {
            toast.success(msg);
            setOpen(false);
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}
    </div>
  );
}

/* ----------------------------- Edit Modal -------------------------------- */

function EditModal({
  anime,
  onClose,
  onSaved,
  onError,
}: {
  anime: AnimeRow;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  // replace useActionState with useTransition + local state
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);

  const [title, setTitle] = useState(anime.title);
  const [slugInput, setSlugInput] = useState(anime.slug ?? "");
  const derivedSlug = useMemo(
    () => toSlug(slugInput || title || ""),
    [slugInput, title]
  );

  // react to server action result
  useEffect(() => {
    if (!result) return;
    if (result.ok) onSaved("Anime updated!");
    else onError(result.error ?? "Failed to update anime.");
  }, [result, onSaved, onError]);

  // submit handler compatible with server actions
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateAnimeAction(null, formData);
      setResult(res);
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* panel */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(960px,92vw)] rounded-2xl border border-blue-900/60 bg-blue-950/80 backdrop-blur-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Edit: {anime.title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="id" defaultValue={anime.id} />

          {/* LEFT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                name="title"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Suggested slug:{" "}
                <span className="font-mono">{derivedSlug || "…"}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">Slug (optional)</label>
              <input
                name="slug"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 font-mono"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder={derivedSlug}
              />
              <p className="mt-1 text-xs text-slate-400">
                Leave blank to auto-generate from title.
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">Synopsis</label>
              <textarea
                name="synopsis"
                rows={6}
                defaultValue={anime.synopsis ?? ""}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Season</label>
                <select
                  name="season"
                  defaultValue={anime.season ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                >
                  <option value="">—</option>
                  <option>Winter</option>
                  <option>Spring</option>
                  <option>Summer</option>
                  <option>Fall</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Year</label>
                <input
                  name="year"
                  defaultValue={anime.year ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Episodes</label>
                <input
                  name="episodes"
                  defaultValue={anime.episodes ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={anime.status ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Genres (comma-separated)</label>
              <input
                name="genres"
                defaultValue={(anime.genres ?? []).join(", ")}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">AniList ID</label>
                <input
                  name="anilist_id"
                  defaultValue={anime.anilist_id ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">MyAnimeList ID</label>
                <input
                  name="mal_id"
                  defaultValue={anime.mal_id ?? ""}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Cover image (replace)</label>
              <input
                type="file"
                name="cover"
                accept="image/*"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Stored as <code>&lt;slug&gt;.&lt;ext&gt;</code> in <code>covers</code> bucket.
              </p>
              {anime.cover_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${anime.cover_path}`}
                  alt="Current cover"
                  className="mt-2 h-24 w-16 rounded-md object-cover border border-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Banner image (replace)</label>
              <input
                type="file"
                name="banner"
                accept="image/*"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Stored as <code>&lt;slug&gt;.&lt;ext&gt;</code> in <code>banners</code> bucket.
              </p>
              {anime.banner_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/banners/${anime.banner_path}`}
                  alt="Current banner"
                  className="mt-2 h-16 w-full rounded-md object-cover border border-slate-700"
                />
              )}
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
