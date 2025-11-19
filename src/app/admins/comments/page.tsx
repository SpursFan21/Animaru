//Animaru\src\app\admins\page.tsx

"use client";

import useSWR from "swr";
import Link from "next/link";

type ThreadSummary = {
  threadId: string;
  commentCount: number;
  lastCommentAt: string | null;
};

type ThreadsResponse = {
  threads: ThreadSummary[];
};

const fetcher = async (url: string): Promise<ThreadsResponse> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to load comment threads (${res.status})`);
  }
  return (await res.json()) as ThreadsResponse;
};

export default function AdminCommentsPage() {
  const { data, error, isLoading } = useSWR<ThreadsResponse>(
    "/api/admin/comments/threads",
    fetcher,
  );

  const threads = data?.threads ?? [];

  return (
    <main className="min-h-[70vh] bg-blue-950 text-slate-100">
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Comment Moderation
        </h1>
        <p className="text-slate-400 mt-1">
          Review all episodes that have comments. Click a thread to view,
          delete, or flag comments as spoilers.
        </p>
      </header>

      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border border-blue-800 bg-blue-900/40 backdrop-blur shadow-xl">
          <div className="px-4 sm:px-6 py-3 border-b border-blue-800/70 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-300">
              Threads with comments:{" "}
              <span className="font-semibold">{threads.length}</span>
            </span>
          </div>

          <div className="px-4 sm:px-6 py-4">
            {isLoading && (
              <p className="text-slate-300 text-sm">Loading threads…</p>
            )}
            {error && (
              <p className="text-sm text-red-300">
                {(error as Error).message ?? "Failed to load threads."}
              </p>
            )}
            {!isLoading && !error && threads.length === 0 && (
              <p className="text-sm text-slate-400">
                No comment threads yet. Once users start commenting on
                episodes, they&apos;ll appear here.
              </p>
            )}

            {threads.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-800/80 text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3 text-left">Thread</th>
                      <th className="py-2 px-3 text-left">Comments</th>
                      <th className="py-2 px-3 text-left">Last activity</th>
                      <th className="py-2 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threads.map((t) => {
                      const [animeId, epStr] = t.threadId.split(":");
                      const episodeNumber = epStr ?? "?";
                      const last =
                        t.lastCommentAt &&
                        new Date(t.lastCommentAt).toLocaleString();

                      return (
                        <tr
                          key={t.threadId}
                          className="border-b border-blue-900/60 last:border-0"
                        >
                          <td className="py-2 pr-3 align-middle">
                            <div className="font-mono text-xs text-slate-300">
                              {t.threadId}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Anime ID: {animeId ?? "?"} • Episode:{" "}
                              {episodeNumber}
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <span className="inline-flex items-center rounded-full bg-blue-950/80 border border-blue-800 px-2 py-0.5 text-xs">
                              {t.commentCount}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle text-xs text-slate-400">
                            {last ?? "—"}
                          </td>
                          <td className="py-2 pl-3 align-middle text-right">
                            <Link
                              href={`/admins/comments/${encodeURIComponent(
                                t.threadId,
                              )}`}
                              className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold hover:bg-sky-500"
                            >
                              View comments
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
