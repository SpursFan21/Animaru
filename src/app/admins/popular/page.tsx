//Animaru\src\app\admins\popular\page.tsx

import Link from "next/link";
import { loadPopularData } from "./actions";
import PopularManagerClient from "./PopularManagerClient";

export const dynamic = "force-dynamic";

export default async function PopularManagerPage() {
  const { rotation, candidates } = await loadPopularData();

  return (
    <main className="min-h-[70vh]">
      <header className="mb-6">
        <nav className="text-sm text-slate-300/90">
          <Link href="/admins" className="hover:underline">Admin</Link>
          <span className="mx-1">/</span>
          <span>Popular Manager</span>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold">Popular Manager</h1>
        <p className="text-slate-300/90">Pick up to 10 anime to appear in the homepage “Popular Anime” section, and set their order.</p>
      </header>

      <div className="rounded-2xl border border-blue-900/60 bg-blue-950/60 p-5 shadow-xl">
        <PopularManagerClient initialRotation={rotation} candidates={candidates} />
      </div>
    </main>
  );
}
