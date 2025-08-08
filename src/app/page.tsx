// Animaru/src/app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-blue-950 text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-sky-400">
          Welcome to Animaru
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          Your gateway to high-quality anime streaming — modern, fast, and
          powered by serverless tech. Browse, watch, and stay up-to-date with
          your favorite shows.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">

           {/*smoke test tailwind css*/}
          <div className="test-tailwind text-center mt-4">Tailwind is working</div>




          <Link
            href="/login"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md font-semibold"
          >
            Login →
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold"
          >
            Sign Up →
          </Link>
        </div>
      </section>

      {/* Trending placeholders */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold mb-6">Trending Anime</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-900/60 rounded-lg overflow-hidden shadow-lg h-60 flex items-center justify-center text-slate-400"
            >
              Image {i + 1}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
