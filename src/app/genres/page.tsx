//src\app\genres\page.tsx

"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Dark Fantasy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Kids",
  "Magic",
  "Martial Arts",
  "Romance",
  "School",
  "Sci-Fi",
  "Seinen",
  "Shoujo",
  "Shounen",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
].sort();

export default function GenresPage() {
  return (
    <div className="px-6 py-10 text-slate-100 min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-4 text-center text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
          Browse by Genre
        </h1>
        <p className="text-center text-slate-400 mb-10 text-sm">
          Select a genre below to explore anime in that category.
        </p>

        <motion.div
          className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {GENRES.map((genre) => (
            <motion.div
              key={genre}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.07, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex"
            >
              <Link
                href={`/genres/${genre.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-1 rounded-xl border border-blue-700/70 bg-blue-950/60 hover:bg-sky-800/40 py-4 text-center text-base font-semibold tracking-wide text-slate-100 transition-all duration-200 shadow-[0_0_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_12px_rgba(56,189,248,0.4)] hover:border-sky-500/70"
              >
                {genre}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
