//Animaru\src\app\admins\episodes\[animeId]\page.tsx

import { getAnimeWithEpisodes } from "../actions";
import EpisodeTable from "../EpisodeTable";

type Props = { params: { animeId: string } };

export default async function Page({ params }: Props) {
  const { anime, episodes, subtitles } = await getAnimeWithEpisodes(params.animeId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{anime.title}</h1>
        <p className="text-slate-400">Create & edit episodes; thumbnails go to the <code>covers</code> bucket.</p>
      </header>

      <EpisodeTable
        anime={{ id: anime.id, title: anime.title, slug: anime.slug ?? "" }}
        initialEpisodes={episodes}
        subtitleOptions={subtitles}
      />
    </div>
  );
}
