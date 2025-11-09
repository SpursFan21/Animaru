//Animaru\src\app\admins\upload\UploadAnimeForm.tsx

"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createAnimeAction } from "./actions";

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
      {pending ? "Creating…" : "Create Anime"}
    </button>
  );
}

export default function UploadAnimeForm() {
  const [result, action] = useActionState(createAnimeAction, null as any);
  const [title, setTitle] = useState("");
  const derivedSlug = useMemo(() => toSlug(title || ""), [title]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      toast.success("Anime created!");
      // reset the form and derived fields
      formRef.current?.reset();
      setTitle("");
    } else {
      toast.error(result.error ?? "Failed to create anime.");
    }
  }, [result]);

  return (
    <form ref={formRef} action={action} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* LEFT */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title *</label>
          <input
            name="title"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            placeholder="Frieren: Beyond Journey’s End"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Suggested slug: <span className="font-mono">{derivedSlug || "…"}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">Slug (optional)</label>
          <input
            name="slug"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 font-mono"
            placeholder={derivedSlug}
          />
          <p className="mt-1 text-xs text-slate-400">Leave blank to auto-generate from title.</p>
        </div>

        <div>
          <label className="block text-sm mb-1">Synopsis</label>
          <textarea
            name="synopsis"
            rows={6}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            placeholder="Short description…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Season</label>
            <select
              name="season"
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
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="2023"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Episodes</label>
            <input
              name="episodes"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="24"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              name="status"
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
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
            placeholder="adventure, fantasy, drama"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">AniList ID</label>
            <input
              name="anilist_id"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="154587"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">MyAnimeList ID</label>
            <input
              name="mal_id"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="52991"
            />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Cover image (bucket: covers)</label>
          <input
            type="file"
            name="cover"
            accept="image/*"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-400">
            Stored as <code>&lt;slug&gt;.&lt;ext&gt;</code> in the <code>covers</code> bucket.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">Banner image (bucket: banners)</label>
          <input
            type="file"
            name="banner"
            accept="image/*"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-400">
            Stored as <code>&lt;slug&gt;.&lt;ext&gt;</code> in the <code>banners</code> bucket.
          </p>
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        {result?.error && (
          <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-800 rounded-lg p-3">
            {result.error}
          </div>
        )}
      </div>
    </form>
  );
}
