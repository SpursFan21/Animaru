//src/app/admins/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import {
  Users,
  Ticket,
  Subtitles,
  Upload,
  Edit3,
  Database,
  Wrench,
  Shield,
} from "lucide-react";

type Tile = {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TILES: Tile[] = [
  {
    href: "/admins/users",
    title: "Manage Users",
    desc: "Promote, ban, reset passwords, view profiles",
    icon: Users,
  },
  {
    href: "/admins/tickets",
    title: "Manage Tickets",
    desc: "Support queue, status, assignments",
    icon: Ticket,
  },
  {
    href: "/admins/subtitles",
    title: "Generate Subtitles",
    desc: "Whisper jobs, attach to Mux assets",
    icon: Subtitles,
  },
  {
    href: "/admins/anime/upload",
    title: "Upload Anime",
    desc: "Create entries, upload covers/banners",
    icon: Upload,
  },
  {
    href: "/admins/anime/manage",
    title: "Update Anime",
    desc: "Edit metadata, seasons, episodes",
    icon: Edit3,
  },
  {
    href: "/admins/storage",
    title: "Storage",
    desc: "Covers, banners, subtitles buckets",
    icon: Database,
  },
  {
    href: "/admins/tools",
    title: "Admin Tools",
    desc: "Bulk jobs, re-index, cache bust",
    icon: Wrench,
  },
  {
    href: "/admins/settings",
    title: "Settings",
    desc: "Feature flags, API keys, roles",
    icon: Shield,
  },
];

export default function AdminHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) must be logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) router.replace("/login");
        return;
      }

      // 2) must be in public.admins
      const uid = session.user.id;
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        router.replace("/"); // logged in but not admin
        return;
      }

      setAllowed(true);
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking && !allowed) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="rounded-xl border border-blue-800 bg-blue-900/40 px-6 py-4 text-slate-300 shadow">
          Checking admin access…
        </div>
      </div>
    );
  }

  // --- Admin Console UI ---
  return (
    <main className="min-h-[70vh]">
      {/* Heading */}
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome back. Pick a tool to get started.
        </p>
      </header>

      {/* Console */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-blue-800 bg-blue-900/30 backdrop-blur shadow-xl">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-blue-800/80">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span>system</span>
              <span className="text-slate-500">•</span>
              <span>ready</span>
            </div>
            <div className="text-xs text-slate-400">v1.0 • Animaru Admin</div>
          </div>

          {/* Grid of actions */}
          <div className="p-4 sm:p-6">
            <ul className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {TILES.map(({ href, title, desc, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="
                      group relative block h-full
                      rounded-xl border border-blue-800 bg-blue-900/50 hover:bg-blue-900/60
                      hover:border-sky-600 transition
                      p-4 sm:p-5 shadow hover:shadow-lg
                      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-blue-800 bg-blue-950/60 p-2">
                        <Icon className="h-5 w-5 text-sky-400 group-hover:text-sky-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight group-hover:text-white">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{desc}</p>
                      </div>
                    </div>

                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-1 group-hover:ring-sky-500/40"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer strip */}
          <div className="px-4 sm:px-6 py-3 border-t border-blue-800/80 text-xs text-slate-400 flex flex-wrap items-center gap-3">
            <span>Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800">/</kbd> search (soon)</span>
            <span className="text-slate-600">•</span>
            <span>Logs & metrics coming soon</span>
          </div>
        </div>
      </section>
    </main>
  );
}
