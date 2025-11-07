//Animaru\src\app\admins\subtitles\library\page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../_components/AdminShell";

type VttFile = {
  name: string;
  key: string;                // "sb:..." or "local:..."
  size: number;
  updatedAt: string | null;
  publicUrl: string | null;   // may be null for local rows
  source: "supabase" | "local";
};

export default function VttLibraryPage() {
  const [files, setFiles] = useState<VttFile[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const [trackName, setTrackName] = useState("English CC");
  const [assetId, setAssetId] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return files;
    return files.filter((f) => f.name.toLowerCase().includes(t));
  }, [files, q]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/subtitles/list");
        const json = await res.json();
        if (json.ok) setFiles(json.files);
      } catch {
        setFiles([]);
      }
    })();
  }, []);

  async function attach(key: string) {
    if (!assetId) {
      alert("Enter a Mux Asset ID first.");
      return;
    }
    try {
      setBusy(key);
      const res = await fetch("/api/admin/subtitles/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, bucketKey: key, languageCode: lang, name: trackName }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Attach failed");
      alert(`Attached ${key} to asset ${assetId}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  function fmtSize(n: number) {
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
    }

  return (
    <AdminShell title="Subtitle Library" subtitle="Pick a VTT and attach it to a Mux asset.">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="flex-1">
            <div className="text-sm text-slate-300 mb-1">Mux Asset ID</div>
            <input
              className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="mux asset id"
            />
          </label>
          <label>
            <div className="text-sm text-slate-300 mb-1">Language code</div>
            <input
              className="rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2 w-32"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              placeholder="en"
            />
          </label>
          <label className="flex-1">
            <div className="text-sm text-slate-300 mb-1">Track name</div>
            <input
              className="w-full rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="English CC"
            />
          </label>
          <div className="flex-1" />
        </div>

        <div className="flex items-center gap-2">
          <input
            className="px-3 py-2 rounded-md border border-blue-800 bg-blue-900/60 outline-none"
            placeholder="Filter by file name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-blue-800 bg-blue-900/30">
          <div className="grid grid-cols-12 px-4 py-3 text-slate-300 text-sm border-b border-blue-800">
            <div className="col-span-6">VTT file</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-1">Updated</div>
            <div className="col-span-1 text-right">Attach</div>
          </div>
          <ul className="divide-y divide-blue-800">
            {filtered.map((f) => (
              <li key={f.key} className="px-4 py-3 grid grid-cols-12 items-center gap-2">
                <div className="col-span-6 truncate">{f.name}</div>
                <div className="col-span-2">{fmtSize(f.size)}</div>
                <div className="col-span-2 capitalize">{f.source}</div>
                <div className="col-span-1">{f.updatedAt ? new Date(f.updatedAt).toLocaleString() : "—"}</div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => attach(f.key)}
                    disabled={!assetId || busy === f.key}
                    className="px-2 py-1 text-xs rounded-md border border-blue-800 hover:border-sky-500 disabled:opacity-60"
                    title={!assetId ? "Enter a Mux asset ID first" : ""}
                  >
                    {busy === f.key ? "Attaching…" : "Attach"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
