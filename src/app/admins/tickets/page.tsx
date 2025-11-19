//src\app\admins\tickets\page.tsx

"use client";

import { useEffect, useState } from "react";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AdminShell from "../_components/AdminShell";

type Response = {
  adminId?: string | null;
  message: string;
  timestamp: string;
};

type Ticket = {
  _id: string;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "closed" | string;
  responses: Response[];
  createdAt: string;
};


export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const [search, setSearch] = useState("");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch tickets");
      }
      const data = (await res.json()) as Ticket[];
      setTickets(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (filter === "open" && t.status !== "open") return false;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.userId.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedTicketId(expandedTicketId === id ? null : id);
    setResponseText("");
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return;
    try {
      const res = await fetch(`/api/admin/tickets/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: responseText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send response");
      }
      showFlash("Response sent");
      setResponseText("");
      await fetchTickets();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to send response");
    }
  };

  const handleClose = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}/close`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to close ticket");
      }
      showFlash("Ticket closed");
      await fetchTickets();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to close ticket");
    }
  };

  return (
    <AdminShell
      title="Support Tickets"
      subtitle="Monitor and respond to user support requests."
    >
      <div className="p-4 text-slate-100">
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

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-sm text-slate-300">
              Filter, respond and close user tickets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject or user ID…"
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "open")}
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open only</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-300">Loading tickets…</p>}
        {!loading && filteredTickets.length === 0 && (
          <p className="text-sm text-slate-400">No tickets found.</p>
        )}

        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-amber-400">
                    {ticket.subject}
                  </h2>
                  <p className="text-xs text-slate-300 font-mono">
                    From: {ticket.userId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-[11px] rounded-full font-semibold ${
                      ticket.status === "open"
                        ? "bg-emerald-900 text-emerald-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => toggleExpand(ticket._id)}
                  className="text-sm text-sky-400 hover:underline"
                >
                  {expandedTicketId === ticket._id ? "Collapse" : "View"}
                </button>
              </div>

              {expandedTicketId === ticket._id && (
                <div className="mt-4 space-y-3">
                  <div className="bg-slate-950 rounded-md p-3 text-sm">
                    <p className="font-semibold mb-1">User message</p>
                    <p className="whitespace-pre-wrap text-slate-200">
                      {ticket.message}
                    </p>
                  </div>

                  {ticket.responses?.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm mb-1">
                        Admin responses
                      </p>
                      {ticket.responses.map((res, i) => (
                        <div
                          key={i}
                          className="mt-1 px-3 py-2 bg-slate-950 rounded-md text-sm"
                        >
                          <p className="text-slate-200">{res.message}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            — {res.adminId || "admin"} •{" "}
                            {new Date(res.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {ticket.status === "open" && (
                    <>
                      <div className="flex items-start gap-2 mt-3">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write a response…"
                          rows={2}
                          className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleRespond(ticket._id)}
                          className="rounded-md bg-amber-600 hover:bg-amber-500 p-2 text-white"
                        >
                          <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleClose(ticket._id)}
                        className="mt-2 inline-flex items-center text-xs text-red-400 hover:underline"
                      >
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Close ticket
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
