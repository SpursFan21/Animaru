//Animaru\src\app\admins\episodes\page.tsx

import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { createClient } from "@supabase/supabase-js";

export const metadata = { title: "Manage Episodes | Admin" };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
}

type Row = {
  id: string;
  title: string;
  slug: string | null;
  season: string | null;
  year: number | null;
  cover_path: string | null;
};

const coverUrl = (path: string | null) =>
  path ? `${SUPABASE_URL}/storage/v1/object/public/covers/${path}` : "";

export default async function Page() {
  const supabase = sbAdmin();
  const { data } = await supabase
    .from("anime")
    .select("id,title,slug,season,year,cover_path")
    .order("title", { ascending: true });

  const list: Row[] = data ?? [];

  return (
    <AdminShell
      title="Manage Episodes"
      subtitle="Pick an anime to create, edit and organize episodes."
    >
      {/* Panel wrapper for contrast */}
      <div className="rounded-2xl border border-blue-900/60 bg-slate-900/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {list.map((a) => (
            <Link
              key={a.id}
              href={`/admins/episodes/${a.id}`}
              className="group relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/40 hover:bg-slate-900/60 transition"
            >
              {/* Cover image as background */}
              {a.cover_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl(a.cover_path)}
                  alt={a.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                />
              )}

              {/* readable overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />

              {/* content */}
              <div className="relative z-10 p-4">
                <div className="font-semibold leading-tight line-clamp-2">
                  {a.title}
                </div>
                <div className="mt-1 text-xs text-slate-300/80">
                  {a.season ?? "—"} {a.year ?? ""}
                </div>
              </div>
            </Link>
          ))}

          {list.length === 0 && (
            <div className="text-sm text-slate-400">
              No anime found. Create one first.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
