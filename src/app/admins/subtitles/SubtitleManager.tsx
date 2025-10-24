//src\app\admins\subtitles\SubtitleManager.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

type VideoFile = {
  name: string;
  size: number;       // bytes
  mtimeMs: number;    // last-modified
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "-";
  }
}

export default function SubtitleManager() {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return files;
    return files.filter((f) => f.name.toLowerCase().includes(term));
  }, [files, q]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/videos");
      const json = (await res.json()) as { ok: boolean; files?: VideoFile[]; error?: string };
      if (!json.ok) throw new Error(json.error || "Failed to load");
      setFiles(json.files ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/videos", { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Upload failed");
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
    }
  }

  async function onDelete(name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/videos?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Delete failed");
      if (selected === name) setSelected(null);
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onCreateSub(name: string) {
    // You can open a modal or route to a wizard here.
    // For now we just emit a placeholder and keep selection.
    alert(`Create subtitles for: ${name}\n\n(Next step: open modal/wizard UI)`);
  }

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-800 bg-blue-950/60 hover:border-sky-600 cursor-pointer">
            <span className="text-slate-200 text-sm">{busy ? "Uploading…" : "Upload .mp4"}</span>
            <input
              type="file"
              accept="video/mp4"
              className="hidden"
              disabled={busy}
              onChange={onUpload}
            />
          </label>

          <button
            onClick={() => void refresh()}
            disabled={busy}
            className="px-3 py-2 rounded-md border border-blue-800 bg-blue-950/60 hover:border-sky-600 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name…"
            className="px-3 py-2 rounded-md border border-blue-800 bg-blue-950/60 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-blue-800 bg-blue-900/30">
        <div className="grid grid-cols-12 px-4 py-3 text-slate-300 text-sm border-b border-blue-800">
          <div className="col-span-6">File</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Modified</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-slate-400">No videos in /media/videos.</div>
        ) : (
          <ul className="divide-y divide-blue-800">
            {filtered.map((f) => {
              const isSel = selected === f.name;
              return (
                <li key={f.name} className="px-4 py-3 grid grid-cols-12 items-center gap-2 hover:bg-blue-900/40">
                  <div className="col-span-6">
                    <button
                      onClick={() => setSelected((s) => (s === f.name ? null : f.name))}
                      className={`text-left w-full truncate ${isSel ? "text-sky-300" : "text-slate-200"}`}
                      title={f.name}
                    >
                      {f.name}
                    </button>
                  </div>
                  <div className="col-span-2 text-slate-300">{formatBytes(f.size)}</div>
                  <div className="col-span-3 text-slate-300">{formatDate(f.mtimeMs)}</div>
                  <div className="col-span-1 flex justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDelete(f.name)}
                        disabled={busy}
                        className="px-2 py-1 text-xs rounded-md border border-blue-800 hover:border-rose-500"
                        title="Delete"
                      >
                        Delete
                      </button>

                      {/* “Create subtitles” dropdown-lite */}
                      <div className="relative">
                        <details>
                          <summary
                            className="list-none px-2 py-1 text-xs rounded-md border border-blue-800 hover:border-sky-500 cursor-pointer select-none"
                            onClick={(e) => {
                              // stop row selection toggle
                              e.preventDefault();
                              (e.currentTarget.parentElement as HTMLDetailsElement).open =
                                !(e.currentTarget.parentElement as HTMLDetailsElement).open;
                              setSelected(f.name);
                            }}
                          >
                            Actions
                          </summary>
                          <div className="absolute right-0 mt-2 w-44 rounded-md border border-blue-800 bg-blue-950/95 shadow-lg z-10">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-900/60"
                              onClick={() => onCreateSub(f.name)}
                            >
                              Create subtitles
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
