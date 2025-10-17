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

type MuxTrackResponse = { data: MuxTrackData };

// ---- helper to get credentials ----
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

// ---- list all tracks for an asset ----
export async function listTracks(assetId: string) {
  const { id, key } = getMuxCreds();
  const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}/tracks`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${key}`).toString("base64"),
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { data: MuxTrackData[] };
}

// ---- delete a specific track ----
export async function deleteTrack(assetId: string, trackId: string) {
  const { id, key } = getMuxCreds();
  const res = await fetch(
    `https://api.mux.com/video/v1/assets/${assetId}/tracks/${trackId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Basic " + Buffer.from(`${id}:${key}`).toString("base64"),
      },
    }
  );

  if (!res.ok) throw new Error(await res.text());
  console.log(`🗑️ Deleted existing track ${trackId}`);
}

// ---- upload a new subtitle track (auto cleanup same-name) ----
export async function uploadSubtitleToMux(
  assetId: string,
  subtitleUrl: string,
  languageCode = "en",
  name = "English CC"
) {
  const { id, key } = getMuxCreds();

  // Step 1: cleanup any existing subtitle track with same name
  const { data: existingTracks } = await listTracks(assetId);
  const sameName = existingTracks.find(
    (t) => t.type === "text" && t.text_type === "subtitles" && t.name === name
  );

  if (sameName) {
    console.log(`Found existing subtitle "${name}" (id: ${sameName.id}), deleting before upload...`);
    await deleteTrack(assetId, sameName.id);
  }

  // Step 2: upload the new subtitle
  const apiUrl = `https://api.mux.com/video/v1/assets/${assetId}/tracks`;
  const body = {
    url: subtitleUrl,
    type: "text",
    text_type: "subtitles",
    language_code: languageCode,
    name,
    closed_captions: true,
  };

  console.log(`Uploading new subtitle "${name}" to ${assetId}...`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${id}:${key}`).toString("base64"),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upload subtitle: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const result = (await response.json()) as MuxTrackResponse;
  console.log(`Uploaded subtitle: ${result.data.name} (status: ${result.data.status})`);
  return result.data;
}
