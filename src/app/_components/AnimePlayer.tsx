//src\app\_components\AnimePlayer.tsx

"use client";

import dynamic from "next/dynamic";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

type Props = {
  playbackId: string;
  poster?: string | null;
  title?: string;
  episodeLabel?: string;
};

export default function AnimePlayer({ playbackId, poster, title, episodeLabel }: Props) {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-blue-800 bg-black">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        poster={poster ?? undefined}
        autoPlay={false}
        muted={false}
        playsInline
        primaryColor="#38bdf8" // Tailwind sky-400
        metadata={{
          video_title: title ?? "Anime",
          viewer_user_id: undefined,
          video_id: playbackId,
          video_stream_type: "on-demand",
        }}
        title={episodeLabel}
        // Controls are on by default; Mux Player includes settings, quality, PiP, AirPlay, cast where available
      />
    </div>
  );
}
