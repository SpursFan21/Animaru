//src/app/admins/page.tsx

"use client";

import Link from "next/link";

import { Users, Ticket, Subtitles, Upload, Edit3, Database, Wrench, Shield, FileText, Video, Star } from "lucide-react";

type Tile = {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TILES: Tile[] = [
  { href: "/admins/users",     title: "Manage Users",       desc: "Promote, ban, reset passwords, view profiles", icon: Users },
  { href: "/admins/tickets",   title: "Manage Tickets",     desc: "Support queue, status, assignments",           icon: Ticket },
  { href: "/admins/subtitles", title: "Generate Subtitles", desc: "Process MP4 → WAV → VTT",                      icon: Subtitles },
  { href: "/admins/subtitles/library", title: "Subtitle Library", desc: "Attach VTTs to Mux assets",               icon: FileText },
  { href: "/admins/upload", title: "Upload Anime",    desc: "Create entries, upload covers/banners",        icon: Upload },
  { href: "/admins/manage", title: "Update Anime",    desc: "Edit metadata, seasons, anime details, images",             icon: Edit3 },
  { href: "/admins/episodes", title: "Manage Episodes", desc: "Create & edit, upload to Mux", icon: Video },
  { href: "/admins/banners", title: "Banner Manager", desc: "Pick 5, order 1–5", icon: Video },
  { href: "/admins/popular", title: "Popular Manager", desc: "Pick up to 10 covers for the homepage grid", icon: Star },
  { href: "/admins/storage",   title: "Storage",            desc: "Covers, banners, subtitles buckets",           icon: Database },
  { href: "/admins/tools",     title: "Admin Tools",        desc: "Bulk jobs, re-index, cache bust",              icon: Wrench },
  { href: "/admins/settings",  title: "Settings",           desc: "Feature flags, API keys, roles",               icon: Shield },
];

export default function AdminHome() {
  return (
    <main className="min-h-[70vh]">
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back. Pick a tool to get started.</p>
      </header>

      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-blue-800 bg-blue-900/30 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-blue-800/80">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span>system</span>
              <span className="text-slate-500">•</span>
              <span>ready</span>
            </div>
            <div className="text-xs text-slate-400">v1.0 • Animaru Admin</div>
          </div>

          <div className="p-4 sm:p-6">
            <ul className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {TILES.map(({ href, title, desc, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group relative block h-full rounded-xl border border-blue-800 bg-blue-900/50 hover:bg-blue-900/60 hover:border-sky-600 transition p-4 sm:p-5 shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-blue-800 bg-blue-950/60 p-2">
                        <Icon className="h-5 w-5 text-sky-400 group-hover:text-sky-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight group-hover:text-white">{title}</h3>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{desc}</p>
                      </div>
                    </div>
                    <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl ring-0 group-hover:ring-1 group-hover:ring-sky-500/40" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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
