//Animaru\src\app\admins\episodes\[animeId]\page.tsx

import AdminShell from "../../_components/AdminShell";
import { getAnimeWithEpisodes } from "../actions";
import EpisodeTable from "../EpisodeTable";

export default async function Page({ params }: { params: { animeId: string } }) {
  const { animeId } = params;
  const { anime, episodes, subtitles } = await getAnimeWithEpisodes(animeId);

  return (
    <AdminShell
      title={`Episodes · ${anime.title}`}
      subtitle="Create, edit, upload to Mux, attach covers & captions."
    >
      <EpisodeTable
        anime={{ id: anime.id, title: anime.title, slug: anime.slug }}
        initialEpisodes={episodes}
        subtitleFiles={subtitles}
      />
    </AdminShell>
  );
}
