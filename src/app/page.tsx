//Animaru/src/app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ocean text-light">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-accent">
          Welcome to <span className="text-sky-400">Animaru</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-xl text-center">
          Your gateway to high-quality anime streaming — modern, fast, and powered by serverless tech.
          Browse, watch, and stay up-to-date with your favorite shows.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 mt-6">
          <Link
            className="card hover:bg-blue-800/30"
            href="/login"
          >
            <h3 className="text-2xl font-bold text-light">Login →</h3>
            <p className="text-base text-slate-300">
              Already have an account? Dive in and start watching.
            </p>
          </Link>
          <Link
            className="card hover:bg-blue-800/30"
            href="/register"
          >
            <h3 className="text-2xl font-bold text-light">Sign Up →</h3>
            <p className="text-base text-slate-300">
              New here? Create an account and join the animeverse.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
