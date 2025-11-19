//Animaru\src\app\help\page.tsx

"use client";

import Link from "next/link";
import { useState } from "react";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-blue-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Help &amp; FAQ</h1>
          <p className="text-slate-300">
            New to Animaru? This page covers the basics of using the site and answers
            common questions about accounts, watching anime, and managing your profile.
          </p>
        </header>

        {/* Quick links */}
        <nav className="mb-10 grid gap-3 sm:grid-cols-2">
          <a
            href="#getting-started"
            className="rounded-xl border border-blue-800 bg-blue-900/40 px-4 py-3 hover:border-sky-500 transition"
          >
            <h2 className="font-semibold text-lg mb-1">Getting started</h2>
            <p className="text-sm text-slate-300">
              Sign up, log in, verify your email, and set up your profile.
            </p>
          </a>
          <a
            href="#core-features"
            className="rounded-xl border border-blue-800 bg-blue-900/40 px-4 py-3 hover:border-sky-500 transition"
          >
            <h2 className="font-semibold text-lg mb-1">Core features</h2>
            <p className="text-sm text-slate-300">
              Learn how to watch episodes, use watchlists, ratings, and comments.
            </p>
          </a>
        </nav>

        {/* Getting started */}
        <section id="getting-started" className="mb-10 space-y-6">
          <h2 className="text-2xl font-bold">Getting started</h2>

          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-4">
            <h3 className="text-xl font-semibold">1. Create an account</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-200 text-sm sm:text-base">
              <li>Click <span className="font-semibold">Register</span> in the top navigation bar.</li>
              <li>Enter your email address, username, and password.</li>
              <li>Submit the form – we&apos;ll create your Animaru account instantly.</li>
            </ol>
            <p className="text-slate-300 text-sm sm:text-base">
              You can browse some areas without an account, but you&apos;ll need one to
              track watch progress, rate shows, comment, and get recommendations.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-4">
            <h3 className="text-xl font-semibold">2. Email verification</h3>
            <p className="text-slate-300 text-sm sm:text-base">
              After registering, we send a verification email to the address you used.
              Open the email on your device and click the confirmation link. You&apos;ll
              be redirected back to Animaru and your account will be verified.
            </p>
            <p className="text-slate-400 text-sm">
              Didn&apos;t get the email? Check your spam folder, then try again from the
              login / register pages.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-4">
            <h3 className="text-xl font-semibold">3. Logging in</h3>
            <p className="text-slate-300 text-sm sm:text-base">
              Use the <span className="font-semibold">Login</span> button in the top
              navigation bar. Once logged in, you&apos;ll see your username and quick
              access to watchlists, resume, and account options.
            </p>
          </div>
        </section>

        {/* Core features guide */}
        <section id="core-features" className="mb-10 space-y-6">
          <h2 className="text-2xl font-bold">How to use core features</h2>

          {/* Browsing & discovering */}
          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Browse and discover anime</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm sm:text-base">
              <li>
                Use the <span className="font-semibold">search bar</span> at the top to
                find titles by name.
              </li>
              <li>
                Explore <span className="font-semibold">Popular Anime</span> and{" "}
                <span className="font-semibold">Top 10</span> on the home page.
              </li>
              <li>
                Logged-in users also get a{" "}
                <span className="font-semibold">Recommended for you</span> rail based on
                your ratings.
              </li>
            </ul>
          </div>

          {/* Anime modal */}
          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Anime details modal</h3>
            <p className="text-slate-300 text-sm sm:text-base">
              Clicking on an anime card opens a detail modal instead of jumping straight
              into the player.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm sm:text-base">
              <li>Read the synopsis and see genres, season, and year.</li>
              <li>Use <span className="font-semibold">Watch now</span> to open the full
                anime page and choose an episode.</li>
              <li>
                Add or update your{" "}
                <span className="font-semibold">watchlist status</span> (Watching, Plan
                to Watch, Completed, Dropped).
              </li>
            </ul>
          </div>

          {/* Watching episodes */}
          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Watching episodes & progress</h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm sm:text-base">
              <li>Open an anime and pick the episode you want to watch.</li>
              <li>Use the player controls to play / pause, scrub, and change volume.</li>
              <li>
                Animaru automatically saves your{" "}
                <span className="font-semibold">watch progress</span>. The{" "}
                <span className="font-semibold">Resume</span> button in the header lets
                you jump back into what you were last watching.
              </li>
            </ol>
          </div>

          {/* Watchlist & ratings */}
          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Watchlists & ratings</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm sm:text-base">
              <li>
                From the anime modal or anime page, use{" "}
                <span className="font-semibold">Add to watchlist</span> to set a status.
              </li>
              <li>
                Your watchlist helps the site build{" "}
                <span className="font-semibold">personal recommendations</span>.
              </li>
              <li>
                You can rate shows with stars – 4★ and 5★ ratings are treated as favourites
                and strongly influence recommendations.
              </li>
            </ul>
          </div>

          {/* Comments */}
          <div className="rounded-2xl border border-blue-800 bg-blue-900/40 p-5 space-y-3">
            <h3 className="text-xl font-semibold">Comments & discussions</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm sm:text-base">
              <li>
                Scroll to the <span className="font-semibold">Comments</span> section on
                an anime page.
              </li>
              <li>Post a new comment, reply to others, or upvote/downvote threads.</li>
              <li>
                You need to be logged in to post or vote. Please keep things friendly and
                spoiler-tag major story details.
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-12 space-y-4">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>

          <div className="space-y-3">
            <FAQItem question="Do I need an account to watch anime?">
              You can browse the catalogue without an account, but you&apos;ll need to
              register and log in to track progress, use the Resume button, manage your
              watchlist, rate shows, and leave comments.
            </FAQItem>

            <FAQItem question="Is Animaru free to use?">
              Animaru is currently running as a demo / student project platform. There
              are no subscription charges or payment steps for using the core features.
            </FAQItem>

            <FAQItem question="Why am I seeing 'localhost' in a link or error?">
              If you ever see a link pointing to <code>localhost:3000</code>, it usually
              means a configuration value still points at the development URL. Please try
              returning to{" "}
              <Link href="/" className="text-sky-400 underline">
                the home page
              </Link>{" "}
              and logging in again. If it keeps happening, use the feedback / issue
              options below.
            </FAQItem>

            <FAQItem question="My progress or watchlist didn't update. What should I do?">
              Try refreshing the page first. If the issue persists, log out and back in.
              Because this is an early version of the site, occasional sync issues can
              happen while we&apos;re improving things.
            </FAQItem>

            <FAQItem question="Which devices and browsers are supported?">
              Animaru is built and tested primarily on modern Chromium-based browsers
              (Chrome, Edge, Brave) on desktop. It should also work on recent mobile
              browsers, but video playback quality may vary depending on your device and
              connection.
            </FAQItem>

            <FAQItem question="How can I report a bug or suggest a feature?">
              For now, please contact the site owner or share feedback during demos /
              testing sessions. A dedicated in-app feedback form will be added later.
            </FAQItem>
          </div>
        </section>

        <footer className="border-t border-blue-900 pt-6 text-sm text-slate-400">
          <p>
            Still stuck? Head back to the{" "}
            <Link href="/" className="text-sky-400 hover:underline">
              home page
            </Link>{" "}
            and explore, or reach out during demos for direct support.
          </p>
        </footer>
      </section>
    </main>
  );
}

/**
 * Small collapsible FAQ item.
 */
function FAQItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-800 bg-blue-900/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium">{question}</span>
        <span className="ml-3 text-sky-300 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-slate-300 text-sm sm:text-base">
          {children}
        </div>
      )}
    </div>
  );
}
