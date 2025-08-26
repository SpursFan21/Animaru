//src\app\_components\AnimePlayer.tsx

"use client";

import MuxPlayer from "@mux/mux-player-react";

type Props = {
  playbackId: string;
  title?: string;
  poster?: string | null;
  startTime?: number;          // seconds
  episodeLabel?: string;
  signedUrl?: string;          // optional signed URL instead of playbackId
};

export default function AnimePlayer({
  playbackId,
  title,
  poster,
  startTime,
  episodeLabel,
  signedUrl,
}: Props) {
  const envKey = process.env.NEXT_PUBLIC_MUX_DATA_ENV_KEY;

  return (
    <div className="relative w-full">
      <MuxPlayer
        playbackId={signedUrl ? undefined : playbackId}
        src={signedUrl}
        streamType="on-demand"
        autoPlay={false}
        muted={false}
        poster={poster ?? undefined}
        metadata={{
          video_id: playbackId,
          video_title: episodeLabel ?? title ?? "",
        }}
        envKey={envKey}
        primaryColor="#38bdf8"
        accentColor="#94a3b8"
        defaultHiddenCaptions={false}
        startTime={startTime ?? 0}
        style={{ aspectRatio: "16 / 9", width: "100%", borderRadius: 12, overflow: "hidden" }}
      />
    </div>
  );
}
