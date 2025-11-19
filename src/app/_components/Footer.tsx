//Animaru\src\app\_components\Footer.tsx

"use client";

import Link from "next/link";

const sections = [
  {
    title: "Animaru",
    links: [
      { label: "About", href: "/about" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Trending", href: "/trending" },
      { label: "Movies", href: "/movies" },
      { label: "Most Popular", href: "/popular" },
    ],
  },
  {
    title: "Support",
    links: [
      // Tickets + help centre
      { label: "Help & Support", href: "/account/help" },
      // FAQ page created at /help
      { label: "FAQ", href: "/help" },
      // Report issue goes to the same ticket page as Help & Support
      { label: "Report issue", href: "/account/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-blue-950 text-slate-300 border-t border-blue-900">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Top: brand + nav */}
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold text-sky-400">Animaru</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400 max-w-sm">
              High-quality anime streaming with a modern, fast experience.
              Join the community and never miss a new episode.
            </p>
          </div>

          {sections.map((sec) => (
            <nav key={sec.title} aria-label={sec.title}>
              <h3 className="text-slate-100 font-semibold mb-3">{sec.title}</h3>
              <ul className="space-y-2">
                {sec.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="hover:text-sky-300 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-blue-900/70" />

        {/* Bottom: meta */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Animaru. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="hover:text-sky-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sky-300">
              Terms
            </Link>
            <a
              href="#top"
              className="rounded-md px-3 py-1 bg-blue-900 hover:bg-blue-800 text-slate-100"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
