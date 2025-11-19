//Animaru\src\app\account\help\page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TicketResponse = {
  fromAdmin?: boolean;
  adminId?: string | null;
  message: string;
  timestamp: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "closed" | string;
  responses: TicketResponse[];
  createdAt: string;
};

const SUBJECT_OPTIONS = [
  "Report an issue",
  "Question about my account",
  "Playback / streaming problem",
  "Anime / episode request",
  "Other",
];

export default function HelpPage() {
  const router = useRouter();

  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const truncateMessage = (text: string, id: string) => {
    const isExpanded = expandedTicketId === id;
    if (isExpanded || text.length <= 140) return text;
    return `${text.slice(0, 140)}...`;
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/tickets", {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch tickets");
      }
      const data = (await res.json()) as Ticket[];

      // sort: open first, then closed
      const sorted = [...data].sort((a, b) => {
        if (a.status === "open" && b.status === "closed") return -1;
        if (a.status === "closed" && b.status === "open") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTickets(sorted);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!subject || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit ticket");
      }

      setSubject(SUBJECT_OPTIONS[0]);
      setMessage("");
      showFlash("Ticket submitted successfully!");
      await fetchTickets();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to submit ticket. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 py-10">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-sm text-sky-400 hover:underline mb-4"
        >
          ← Back to account
        </button>

        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-slate-300 mb-6">
          Browse quick info about Animaru and open a support ticket if you need help.
        </p>

        {flash && (
          <div className="mb-4 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Quick docs (simple accordions) */}
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <DocCard title="What is Animaru?">
            <ul className="list-disc ml-5 space-y-1 text-sm text-slate-200">
              <li>Stream anime episodes in HD using our cloud streaming pipeline.</li>
              <li>Resume where you left off with watch progress tracking.</li>
              <li>Rate shows and get personalized recommendations.</li>
            </ul>
          </DocCard>
          <DocCard title="Playback issues">
            <ul className="list-disc ml-5 space-y-1 text-sm text-slate-200">
              <li>Try lowering quality or refreshing the player.</li>
              <li>Check your connection &amp; disable heavy downloads.</li>
              <li>If issues persist, open a ticket with the show &amp; episode.</li>
            </ul>
          </DocCard>
        </div>

        {/* Submit ticket */}
        <div className="mb-10 rounded-2xl border border-blue-800 bg-blue-900/40 p-5">
          <h2 className="text-xl font-semibold mb-3">Submit a support ticket</h2>

          <label className="block text-sm mb-1">Subject</label>
          <select
            className="w-full mb-3 rounded-md bg-blue-950 border border-blue-800 px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <label className="block text-sm mb-1">Details</label>
          <textarea
            className="w-full rounded-md bg-blue-950 border border-blue-800 px-3 py-2 text-sm min-h-[120px] mb-3"
            placeholder="Describe your issue or question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
        </div>

        {/* Existing tickets */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your tickets</h2>

          {loading && <p className="text-sm text-slate-300">Loading tickets…</p>}
          {!loading && tickets.length === 0 && (
            <p className="text-sm text-slate-400">
              You haven&apos;t submitted any tickets yet.
            </p>
          )}

          <div className="space-y-4">
            {tickets.map((t) => {
              const isClosed = t.status.toLowerCase() === "closed";
              const isExpanded = expandedTicketId === t.id;

              const normalized = (t.responses ?? []).map((r) => ({
                ...r,
                isAdmin:
                  typeof r.fromAdmin === "boolean"
                    ? r.fromAdmin
                    : Boolean(r.adminId),
              }));

              return (
                <Link
                  key={t.id}
                  href={`/account/help/tickets/${t.id}`}
                  className={`block rounded-xl border p-4 transition ${
                    isClosed
                      ? "bg-blue-950 border-red-700/60 hover:border-red-500"
                      : "bg-blue-900/60 border-emerald-700/60 hover:border-emerald-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold mb-1">{t.subject}</div>
                      <p className="text-sm text-slate-200 mb-1">
                        {truncateMessage(t.message, t.id)}{" "}
                        {t.message.length > 140 && (
                          <button
                            className="text-xs text-sky-400 underline"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedTicketId(isExpanded ? null : t.id);
                            }}
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </p>
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-full ${
                          isClosed
                            ? "bg-red-900 text-red-200"
                            : "bg-emerald-900 text-emerald-200"
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Submitted: {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {normalized.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {normalized.map((r, idx) => (
                        <div key={idx} className="text-xs text-slate-200">
                          <span
                            className={
                              r.isAdmin ? "text-amber-300" : "text-slate-300"
                            }
                          >
                            {r.isAdmin ? "Admin:" : "You:"}
                          </span>{" "}
                          {r.message}
                          <p className="text-[11px] text-slate-500 ml-4">
                            {new Date(r.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

type DocCardProps = {
  title: string;
  children: React.ReactNode;
};

function DocCard({ title, children }: DocCardProps) {
  return (
    <div className="rounded-xl border border-blue-800 bg-blue-900/40 p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
