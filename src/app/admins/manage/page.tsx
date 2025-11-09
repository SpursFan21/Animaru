//Animaru\src\app\admins\manage\page.tsx

import AdminShell from "../_components/AdminShell";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import ManageAnimeClient from "./ManageAnimeClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const metadata = { title: "Update Anime | Admin" };

export default async function Page() {
  const supabase = sbAdmin();

  const { data: animes, error } = await supabase
    .from("anime")
    .select("id, slug, title, season, year, episodes, status, cover_path, banner_path, synopsis, genres, anilist_id, mal_id")
    .order("title", { ascending: true });

  if (error) {
    // very basic fallback; you can toast on client if you prefer
    return (
      <AdminShell title="Update Anime" subtitle="Edit metadata, seasons, episodes.">
        <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-rose-300">
          Failed to load anime list: {error.message}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Update Anime" subtitle="Edit metadata, seasons, episodes.">
      <ManageAnimeClient initialAnimes={animes ?? []} />
    </AdminShell>
  );
}
