//Animaru\src\app\account\help\tickets\[ticketId]\page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TicketResponse = {
  fromAdmin?: boolean;
  adminId?: string | null;
  message: string;
  timestamp: string;
};

type Ticket = {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "closed" | string;
  responses: TicketResponse[];
  createdAt: string;
};

export default function TicketThreadPage() {
  const params = useParams();
  const router = useRouter();

  const ticketId =
    typeof params?.ticketId === "string"
      ? params.ticketId
      : Array.isArray(params?.ticketId)
      ? params.ticketId[0]
      : "";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const fetchTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/tickets/${ticketId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch ticket");
      }
      const data = (await res.json()) as Ticket;
      setTicket(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load ticket");
      // slight delay so they can see error before redirect if you want
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleReply = async () => {
    if (!reply.trim() || !ticketId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reply");
      }
      setReply("");
      showFlash("Reply sent!");
      await fetchTicket();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-950 text-slate-100">
        <section className="max-w-3xl mx-auto px-4 py-10">
          <p>Loading ticket…</p>
        </section>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="min-h-screen bg-blue-950 text-slate-100">
        <section className="max-w-3xl mx-auto px-4 py-10">
          <p>Ticket not found.</p>
          <button
            onClick={() => router.push("/account/help")}
            className="mt-4 text-sky-400 hover:underline text-sm"
          >
            ← Back to Help
          </button>
        </section>
      </main>
    );
  }

  const normalized = (ticket.responses ?? []).map((r) => ({
    ...r,
    isAdmin:
      typeof r.fromAdmin === "boolean" ? r.fromAdmin : Boolean(r.adminId),
  }));
  const isClosed = ticket.status === "closed";

  return (
    <main className="min-h-screen bg-blue-950 text-slate-100">
      <section className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => router.back()}
          className="text-sky-400 hover:underline text-sm mb-4"
        >
          ← Back to Help
        </button>

        {flash && (
          <div className="mb-3 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-blue-800 bg-blue-900/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isClosed
                  ? "bg-red-900 text-red-200"
                  : "bg-emerald-900 text-emerald-200"
              }`}
            >
              {ticket.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-200 mb-1">{ticket.message}</p>
          <p className="text-[11px] text-slate-500 mb-4">
            Submitted: {new Date(ticket.createdAt).toLocaleString()}
          </p>

          <div className="space-y-3 mb-6">
            {normalized.map((r, idx) => (
              <div
                key={idx}
                className={`rounded-md p-3 text-sm ${
                  r.isAdmin ? "bg-blue-950 border border-amber-500/40" : "bg-blue-950/70"
                }`}
              >
                <p
                  className={`font-semibold mb-1 ${
                    r.isAdmin ? "text-amber-300" : "text-slate-200"
                  }`}
                >
                  {r.isAdmin ? "Admin" : "You"}
                </p>
                <p className="whitespace-pre-wrap text-slate-100">
                  {r.message}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {new Date(r.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {!isClosed ? (
            <div>
              <label className="block text-sm mb-1">Reply</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={4}
                className="w-full rounded-md bg-blue-950 border border-blue-800 px-3 py-2 text-sm mb-2"
              />
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send reply"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              This ticket is closed. Replies are disabled.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
