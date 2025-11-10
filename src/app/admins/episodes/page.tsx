//Animaru\src\app\admins\episodes\page.tsx

import AdminShell from "../_components/AdminShell";
import Link from "next/link";
import { listAnime } from "./actions";

export const metadata = { title: "Manage Episodes | Admin" };

export default async function Page() {
  const animes = await listAnime();

  return (
    <AdminShell title="Manage Episodes" subtitle="Pick an anime to manage its episodes.">
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {animes.map((a) => (
          <Link
            key={a.id}
            href={`/admins/episodes/${a.id}`}
            className="rounded-xl border border-blue-900/40 bg-blue-950/30 hover:bg-blue-950/50 p-4"
          >
            <div className="font-semibold">{a.title}</div>
            <div className="text-xs text-slate-400">
              {a.slug || "—"} • {a.season ?? "?"} • {a.year ?? "—"}
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
