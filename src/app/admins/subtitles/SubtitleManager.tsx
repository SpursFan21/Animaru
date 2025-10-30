//src\app\admins\subtitles\SubtitleManager.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VideoFile = {
  name: string;
  size: number; // bytes
  mtimeMs: number; // last-modified
};

type WizardState = {
  file?: string;
  wavPath?: string;
  vttPath?: string;
  step: "idle" | "extract" | "transcribe" | "upload" | "done";
  model: "tiny" | "base" | "small" | "medium" | "large-v3";
  language?: string;
  cli: "whisper" | "faster-whisper";
  muxAssetId?: string;
  trackName: string;
  langCode: string;
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

  // Wizard state
  const [wiz, setWiz] = useState<WizardState>({
    step: "idle",
    model: "small",
    cli: "whisper",
    trackName: "English CC",
    langCode: "en",
  });
  const modalRef = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return files;
    return files.filter((f) => f.name.toLowerCase().includes(term));
  }, [files, q]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/videos");
      const json = (await res.json()) as {
        ok: boolean;
        files?: VideoFile[];
        error?: string;
      };
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
      const res = await fetch(`/api/admin/videos?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
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

  // ----- Wizard helpers -----
  function openWizard(name: string) {
    setSelected(name);
    setWiz((w) => ({ ...w, file: name, wavPath: undefined, vttPath: undefined, step: "idle" }));
    modalRef.current?.showModal();
  }
  function closeWizard() {
    modalRef.current?.close();
  }

  async function doExtract() {
    setWiz((w) => ({ ...w, step: "extract" }));
    const res = await fetch("/api/admin/subtitles/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wiz.file }),
    });
    const json = await res.json();
    if (!json.ok) {
      setWiz((w) => ({ ...w, step: "idle" }));
      throw new Error(json.error || "extract failed");
    }
    setWiz((w) => ({ ...w, wavPath: json.wavPath }));
  }

  async function doTranscribe() {
    if (!wiz.wavPath) throw new Error("no wav yet");
    setWiz((w) => ({ ...w, step: "transcribe" }));
    const res = await fetch("/api/admin/subtitles/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wavPath: wiz.wavPath,
        model: wiz.model,
        language: wiz.language,
        cli: wiz.cli,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setWiz((w) => ({ ...w, step: "idle" }));
      throw new Error(json.error || "transcribe failed");
    }
    setWiz((w) => ({ ...w, vttPath: json.vttPath }));
  }

  async function doUpload() {
    if (!wiz.vttPath || !wiz.muxAssetId) return;
    setWiz((w) => ({ ...w, step: "upload" }));
    const res = await fetch("/api/admin/subtitles/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: wiz.muxAssetId,
        vttPath: wiz.vttPath,
        languageCode: wiz.langCode,
        name: wiz.trackName,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setWiz((w) => ({ ...w, step: "idle" }));
      throw new Error(json.error || "upload failed");
    }
    setWiz((w) => ({ ...w, step: "done" }));
  }

  // opening the wizard
  function onCreateSub(name: string) {
    openWizard(name);
  }

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-800 bg-blue-950/60 hover:border-sky-600 cursor-pointer">
            <span className="text-slate-200 text-sm">{busy ? "Uploading…" : "Upload .mp4"}</span>
            <input type="file" accept="video/mp4" className="hidden" disabled={busy} onChange={onUpload} />
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

                      {/* Actions dropdown → open wizard */}
                      <div className="relative">
                        <details>
                          <summary
                            className="list-none px-2 py-1 text-xs rounded-md border border-blue-800 hover:border-sky-500 cursor-pointer select-none"
                            onClick={(e) => {
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

      {/* Wizard Modal */}
      <dialog ref={modalRef} className="rounded-xl border border-blue-800 bg-blue-950/95 p-0 w-[36rem] max-w-[95vw]">
        <form method="dialog">
          <div className="px-4 py-3 border-b border-blue-800 flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">Create subtitles</h3>
            <button className="text-slate-300 hover:text-white" onClick={closeWizard}>
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4 text-sm">
            <div className="text-slate-300">
              <div className="mb-1">Source file</div>
              <div className="rounded-md border border-blue-800 bg-blue-900/40 px-3 py-2">{wiz.file}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-slate-300">
                <div className="mb-1">Whisper model</div>
                <select
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  value={wiz.model}
                  onChange={(e) => setWiz((w) => ({ ...w, model: e.target.value as any }))}
                >
                  <option value="tiny">tiny</option>
                  <option value="base">base</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large-v3">large-v3</option>
                </select>
              </label>

              <label className="text-slate-300">
                <div className="mb-1">Language (blank = auto)</div>
                <input
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  placeholder="en"
                  value={wiz.language ?? ""}
                  onChange={(e) => setWiz((w) => ({ ...w, language: e.target.value || undefined }))}
                />
              </label>

              <label className="text-slate-300">
                <div className="mb-1">CLI</div>
                <select
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  value={wiz.cli}
                  onChange={(e) => setWiz((w) => ({ ...w, cli: e.target.value as any }))}
                >
                  <option value="whisper">whisper</option>
                  <option value="faster-whisper">faster-whisper</option>
                </select>
              </label>

              <label className="text-slate-300">
                <div className="mb-1">Mux Asset ID (optional)</div>
                <input
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  placeholder="mux asset id"
                  value={wiz.muxAssetId ?? ""}
                  onChange={(e) => setWiz((w) => ({ ...w, muxAssetId: e.target.value || undefined }))}
                />
              </label>
            </div>

            {/* Upload settings */}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-slate-300">
                <div className="mb-1">Track name</div>
                <input
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  value={wiz.trackName}
                  onChange={(e) => setWiz((w) => ({ ...w, trackName: e.target.value }))}
                />
              </label>
              <label className="text-slate-300">
                <div className="mb-1">Language code</div>
                <input
                  className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-2 py-2"
                  value={wiz.langCode}
                  onChange={(e) => setWiz((w) => ({ ...w, langCode: e.target.value }))}
                />
              </label>
            </div>

            {/* Status */}
            <div className="rounded-md border border-blue-800 bg-blue-900/30 px-3 py-2 text-slate-300">
              <div>WAV: {wiz.wavPath ? "created" : "–"}</div>
              <div>VTT: {wiz.vttPath ? "created" : "–"}</div>
              <div>Upload: {wiz.step === "done" ? "complete" : "–"}</div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-blue-800 flex items-center justify-end gap-2">
            <button className="px-3 py-1.5 rounded-md border border-blue-800 bg-blue-900/60" onClick={closeWizard}>
              Close
            </button>
            <button
              className="px-3 py-1.5 rounded-md border border-blue-800 bg-blue-900/60 hover:border-sky-500"
              onClick={async (e) => {
                e.preventDefault();
                await doExtract();
              }}
              disabled={!!wiz.wavPath}
            >
              1) Extract WAV
            </button>
            <button
              className="px-3 py-1.5 rounded-md border border-blue-800 bg-blue-900/60 hover:border-sky-500 disabled:opacity-60"
              onClick={async (e) => {
                e.preventDefault();
                await doTranscribe();
              }}
              disabled={!wiz.wavPath || !!wiz.vttPath}
            >
              2) Transcribe → VTT
            </button>
            <button
              className="px-3 py-1.5 rounded-md border border-blue-800 bg-blue-900/60 hover:border-sky-500 disabled:opacity-60"
              onClick={async (e) => {
                e.preventDefault();
                await doUpload();
              }}
              disabled={!wiz.vttPath || !wiz.muxAssetId || wiz.step === "done"}
              title={!wiz.muxAssetId ? "Enter a Mux asset id" : ""}
            >
              3) Upload to Mux
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
