//src\app\anime\[slug]\page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";
import AnimePlayer from "../../_components/AnimePlayer";
import EpisodeList from "../../_components/EpisodeList";
import type { Episode } from "../../_components/EpisodeList";
import CommentsSection from "../../_components/CommentsSection";
import RatingWidget from "../../_components/RatingWidget";
import AnimeInfoBox from "../../_components/AnimeInfoBox";


type Anime = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  banner_path: string | null;
  cover_path: string | null;
};

type Variant = "sub" | "dub";

function publicUrl(bucket: "banners" | "covers", path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function AnimeWatchPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- User state ---
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch current user + metadata
  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      if (mounted) {
        setUserId(user.id);

        // Pull name/avatar from metadata
        const name =
          (user.user_metadata?.name as string | undefined) ??
          (user.user_metadata?.full_name as string | undefined) ??
          (user.email ? user.email.split("@")[0] : null);

        const avatar =
          (user.user_metadata?.avatar_url as string | undefined) ?? null;

        setDisplayName(name ?? null);
        setAvatarUrl(avatar);
      }

      // Optional: override with profiles table if it exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && mounted) {
        setDisplayName(profile.username ?? displayName);
        setAvatarUrl(profile.avatar_url ?? avatarUrl);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Variant & episode selection ---
  const qsVariant = (searchParams.get("lang") === "dub" ? "dub" : "sub") as Variant;
  const qsEp = Number(searchParams.get("e") ?? "0");

  const [variant, setVariant] = useState<Variant>(qsVariant);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const next = `/anime/${params.slug}?lang=${variant}${qsEp ? `&e=${qsEp}` : ""}`;
    router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, params.slug]);

  // --- Load anime + episodes ---
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: animeRows, error: ae } = await supabase
          .from("anime")
          .select("id, slug, title, synopsis, banner_path, cover_path")
          .eq("slug", params.slug)
          .limit(1)
          .returns<Anime[]>();

        if (ae) throw ae;
        const a = (animeRows ?? [])[0];
        if (!a) throw new Error("Anime not found.");
        if (!mounted) return;
        setAnime(a);

        const { data: eps, error: ee } = await supabase
          .from("episodes")
          .select(
            "id, anime_id, number, title, duration_seconds, playback_id, thumb_path"
          )
          .eq("anime_id", a.id)
          .eq("variant", variant)
          .order("number", { ascending: true })
          .returns<Episode[]>();

        if (ee) throw ee;

        const clean = (eps ?? []).filter((e) => typeof e.number === "number");
        if (!mounted) return;
        setEpisodes(clean);

        const byQuery = clean.find((ep) => ep.number === qsEp) ?? clean[0] ?? null;
        setCurrentId(byQuery?.id ?? null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load anime.";
        if (mounted) setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [params.slug, variant, qsEp]);

  const current = useMemo(
    () => episodes.find((e) => e.id === currentId) ?? null,
    [episodes, currentId]
  );

  const coverUrl = useMemo(
    () => (anime?.cover_path ? publicUrl("covers", anime.cover_path) : null),
    [anime?.cover_path]
  );
  const bannerUrl = useMemo(
    () => (anime?.banner_path ? publicUrl("banners", anime.banner_path) : null),
    [anime?.banner_path]
  );

  const onSelectEpisode = (ep: Episode) => {
    setCurrentId(ep.id);
    const url = `/anime/${params.slug}?lang=${variant}&e=${ep.number}`;
    router.replace(url);
  };

  if (loading) {
    return <div className="min-h-[70vh] px-4 py-6 text-slate-200">Loading…</div>;
  }

  if (err || !anime) {
    return (
      <div className="min-h-[70vh] px-4 py-6">
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
          {err ?? "Not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Title & meta */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{anime.title}</h1>
          </div>
        </div>

        {/* Layout: player + episodes */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {current?.playback_id ? (
              <>
                <AnimePlayer
                  playbackId={current.playback_id}
                  poster={bannerUrl ?? coverUrl}
                  title={anime.title}
                  episodeLabel={`Episode ${current.number}${
                    current.title ? ` – ${current.title}` : ""
                  } [${variant.toUpperCase()}]`}
                  animeId={anime.id}
                  episodeId={current.id}
                  userId={userId ?? ""}
                />

                {/* Variant toggle */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-300">Audio:</span>
                  <div className="inline-flex rounded-md overflow-hidden border border-blue-800">
                    <button
                      className={[
                        "px-3 py-1.5 text-sm",
                        variant === "sub"
                          ? "bg-sky-600 text-white"
                          : "bg-blue-900/40 hover:bg-blue-900",
                      ].join(" ")}
                      onClick={() => setVariant("sub")}
                    >
                      Sub
                    </button>
                    <button
                      className={[
                        "px-3 py-1.5 text-sm border-l border-blue-800",
                        variant === "dub"
                          ? "bg-sky-600 text-white"
                          : "bg-blue-900/40 hover:bg-blue-900",
                      ].join(" ")}
                      onClick={() => setVariant("dub")}
                    >
                      Dub
                    </button>
                  </div>
                </div>

                {/* Prev/Next controls */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(() => {
                    const idx = current ? episodes.findIndex((e) => e.id === current.id) : -1;
                    const prev = idx > 0 ? episodes[idx - 1] : null;
                    const next =
                      idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null;
                    return (
                      <>
                        {prev && (
                          <button
                            className="px-3 py-1.5 rounded-md border border-blue-800 hover:border-sky-500"
                            onClick={() => onSelectEpisode(prev)}
                          >
                            ← Prev
                          </button>
                        )}
                        {next && (
                          <button
                            className="px-3 py-1.5 rounded-md border border-blue-800 hover:border-sky-500"
                            onClick={() => onSelectEpisode(next)}
                          >
                            Next →
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Comments */}
                <CommentsSection
                  threadId={`${anime.id}:${current.number}`}
                  userId={userId}
                  username={displayName}
                  avatarUrl={avatarUrl}
                />
              </>
            ) : (
              <div className="aspect-video rounded-xl border border-blue-800 bg-blue-950 grid place-items-center">
                <p className="text-slate-300">No video available for this episode.</p>
              </div>
            )}
          </div>

          {/* Right column: rating + episodes */}
          <div className="w-full md:w-[340px] flex-shrink-0 space-y-4">
            <AnimeInfoBox animeId={anime.id} />
            <RatingWidget animeId={anime.id} userId={userId} />
            <EpisodeList episodes={episodes} currentId={currentId} onSelect={onSelectEpisode} posterFallback={bannerUrl ?? coverUrl}/>
          </div>


        </div>
      </div>
    </div>
  );
}
