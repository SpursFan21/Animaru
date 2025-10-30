//src\utils\uploadSubtitleToMux.ts

import dotenv from "dotenv";
dotenv.config();

type MuxTrackData = {
  id: string;
  status: "ready" | "preparing" | "errored" | string;
  type: "text" | string;
  text_type?: "subtitles" | "captions";
  language_code?: string;
  name?: string;
  closed_captions?: boolean;
};
type MuxListTracksResponse = { data: MuxTrackData[] };
type MuxTrackResponse = { data: MuxTrackData };

function getMuxCreds() {
  const id = process.env.MUX_TOKEN_ID;
  const key =
    process.env.MUX_TOKEN_KEY ||
    process.env.MUX_TOKEN_SECRET ||
    process.env.MUX_SECERET_KEY;

  if (!id || !key) {
    throw new Error("Missing MUX credentials (MUX_TOKEN_ID / MUX_TOKEN_KEY).");
  }
  return { id, key };
}

async function fetchMux(
  url: string,
  init?: RequestInit,
  retries = 3,
  backoffMs = 1500
) {
  const { id, key } = getMuxCreds();
  const headers = {
    Authorization: "Basic " + Buffer.from(`${id}:${key}`).toString("base64"),
    ...(init?.headers || {}),
  };

  let lastErr: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, { ...init, headers });
    if (res.ok) return res;
    const text = await res.text();

    // Retry on 5xx or “internal_server_error”
    if (res.status >= 500 || text.includes("internal_server_error")) {
      lastErr = new Error(text || `Mux ${res.status} ${res.statusText}`);
      await new Promise(r => setTimeout(r, backoffMs * attempt));
      continue;
    }
    // Non-retryable:
    throw new Error(text || `Mux ${res.status} ${res.statusText}`);
  }
  throw lastErr || new Error("Unknown Mux error");
}

export async function listTracks(assetId: string) {
  const res = await fetchMux(
    `https://api.mux.com/video/v1/assets/${assetId}/tracks`
  );
  return (await res.json()) as MuxListTracksResponse;
}

export async function deleteTrack(assetId: string, trackId: string) {
  const res = await fetchMux(
    `https://api.mux.com/video/v1/assets/${assetId}/tracks/${trackId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(await res.text());
  console.log(`Deleted track ${trackId}`);
}

async function uploadTrack(
  assetId: string,
  body: {
    url: string;
    type: "text";
    text_type: "subtitles" | "captions";
    language_code: string;
    name: string;
    closed_captions: boolean;
  }
) {
  const res = await fetchMux(
    `https://api.mux.com/video/v1/assets/${assetId}/tracks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return (await res.json()) as MuxTrackResponse;
}

/** Main helper – cleans up dup/errored tracks, uploads, and auto-renames if needed */
export async function uploadSubtitleToMux(
  assetId: string,
  subtitleUrl: string,
  languageCode = "en",
  name = "English CC"
) {
  // 1) List with retry and delete conflicts/errored
  let tracks: MuxTrackData[] = [];
  try {
    const { data } = await listTracks(assetId);
    tracks = data;
  } catch (e) {
    console.warn("listTracks failed, will proceed anyway:", e);
  }

  // Delete same-name subtitle track, if any
  const sameName = tracks.find(
    (t) => t.type === "text" && t.text_type === "subtitles" && t.name === name
  );
  if (sameName) {
    console.log(`Found existing "${name}" (${sameName.id}) → deleting…`);
    await deleteTrack(assetId, sameName.id);
  }

  // Delete any errored subtitle tracks (keeps things tidy)
  const errored = tracks.filter(
    (t) => t.type === "text" && t.text_type === "subtitles" && t.status === "errored"
  );
  for (const t of errored) {
    console.log(`🧹 Removing errored subtitle (${t.id})…`);
    await deleteTrack(assetId, t.id);
  }

  // 2) Upload
  const baseBody = {
    url: subtitleUrl,
    type: "text" as const,
    text_type: "subtitles" as const,
    language_code: languageCode,
    name,
    closed_captions: true,
  };

  console.log(`Uploading subtitle "${name}" → ${assetId} …`);
  try {
    const result = await uploadTrack(assetId, baseBody);
    console.log(`Uploaded: ${result.data.name} (status: ${result.data.status})`);
    return result.data;
  } catch (e: any) {
    const msg = String(e?.message || e);
    // If name is still not unique, auto-rename and retry once
    if (msg.includes("Track name") && msg.includes("not unique")) {
      const altName = `${name} v${Date.now().toString().slice(-5)}`;
      console.log(`Name conflict; retrying with "${altName}" …`);
      const result = await uploadTrack(assetId, { ...baseBody, name: altName });
      console.log(`Uploaded: ${result.data.name} (status: ${result.data.status})`);
      return result.data;
    }
    throw e;
  }
}
