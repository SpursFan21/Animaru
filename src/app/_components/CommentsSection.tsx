//Animaru\src\app\_components\CommentsSection.tsx

"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

/* ============================== Types ============================== */

export type CommentsProps = {
  /** `${animeId}:${episodeNumber}` — sub/dub share the same thread */
  threadId: string;
  /** Supabase uid (null if guest) */
  userId: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

type RawId = unknown; // server may return ObjectId; we normalize via toString()

type RawComment = {
  _id: RawId;
  threadId: string;
  parentId: string | null;
  path: string[];
  content: string;
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  score: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ApiListResponse = {
  comments: RawComment[];
};

export type CommentNode = {
  _id: string;
  threadId: string;
  parentId: string | null;
  path: string[];
  content: string;
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  score: number;
  createdAt: string; // normalized ISO string
  updatedAt: string; // normalized ISO string
  children?: CommentNode[];
};

/* ============================== Fetcher ============================== */

const fetcher = async (url: string, userId?: string): Promise<ApiListResponse> => {
  const res = await fetch(url, {
    headers: userId ? { "x-user-id": userId } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch comments (${res.status})`);
  }
  return (await res.json()) as ApiListResponse;
};

/* ============================== Component ============================== */

export default function CommentsSection({
  threadId,
  userId,
  username,
  avatarUrl,
}: CommentsProps) {
  const { data, mutate, isLoading } = useSWR<
    ApiListResponse,
    Error,
    [string, string | null]
  >([`/api/comments/${encodeURIComponent(threadId)}`, userId], ([u, uid]) =>
    fetcher(u, uid ?? undefined),
  );

  const flat: CommentNode[] = useMemo(() => {
    const src = data?.comments ?? [];
    return src.map((d) => {
      const id =
        (typeof (d._id as { toString?: () => string } | string) === "object" &&
          (d._id as { toString?: () => string }).toString)
          ? (d._id as { toString: () => string }).toString()
          : String(d._id);

      const created =
        typeof d.createdAt === "string"
          ? d.createdAt
          : new Date(d.createdAt).toISOString();
      const updated =
        typeof d.updatedAt === "string"
          ? d.updatedAt
          : new Date(d.updatedAt).toISOString();

      return {
        _id: id,
        threadId: d.threadId,
        parentId: d.parentId,
        path: d.path,
        content: d.content,
        userId: d.userId,
        username: d.username ?? null,
        avatarUrl: d.avatarUrl ?? null,
        score: d.score,
        createdAt: created,
        updatedAt: updated,
      };
    });
  }, [data]);

  const tree = useMemo(() => {
    const byId = new Map<string, CommentNode>();
    flat.forEach((n) => byId.set(n._id, { ...n, children: [] }));
    const roots: CommentNode[] = [];
    flat.forEach((n) => {
      const node = byId.get(n._id)!;
      if (n.parentId && byId.get(n.parentId)) {
        byId.get(n.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [flat]);

  const [newText, setNewText] = useState<string>("");

  async function submit(content: string, parentId: string | null) {
    if (!userId) {
      alert("Please sign in to comment.");
      return;
    }
    const res = await fetch(`/api/comments/${encodeURIComponent(threadId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ content, parentId, username, avatarUrl }),
    });

    if (!res.ok) {
      let message = "Failed to post";
      try {
        const j = (await res.json()) as { error?: string };
        message = j.error ?? message;
      } catch {
        // ignore
      }
      alert(message);
      return;
    }

    await mutate();
  }

  async function vote(commentId: string, dir: 1 | -1 | 0) {
    if (!userId) {
      alert("Please sign in to vote.");
      return;
    }
    const res = await fetch("/api/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ commentId, direction: dir }),
    });
    if (res.ok) {
      await mutate();
    }
  }

  return (
    <section className="mt-10">
      {/* Outer container card */}
      <div className="rounded-2xl border border-blue-800/80 bg-gradient-to-b from-blue-950/90 to-slate-950/90 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-blue-900/80">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
            Comments
          </h2>
          {tree.length > 0 && (
            <span className="text-xs text-slate-400">
              {tree.length} top-level thread{tree.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {/* root composer */}
          <div className="mt-4 rounded-xl border border-blue-800/80 bg-blue-900/70 shadow-inner">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={userId ? "Write a comment…" : "Sign in to comment"}
              className="w-full rounded-t-xl bg-slate-950/80 border-b border-blue-800 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-sky-500"
              rows={3}
              disabled={!userId}
            />
            <div className="px-3 py-2 flex items-center justify-end">
              <button
                onClick={async () => {
                  const trimmed = newText.trim();
                  if (trimmed.length === 0) return;
                  await submit(trimmed, null);
                  setNewText("");
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-600 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!userId || newText.trim().length === 0}
              >
                Post
              </button>
            </div>
          </div>

          {/* list */}
          <div className="mt-5">
            {isLoading ? (
              <p className="text-slate-300 text-sm">Loading…</p>
            ) : tree.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Be the first to comment.
              </p>
            ) : (
              <ul className="space-y-4">
                {tree.map((n) => (
                  <CommentItem
                    key={n._id}
                    node={n}
                    onReply={submit}
                    onVote={vote}
                    depth={0}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== Item ============================== */

function CommentItem({
  node,
  onReply,
  onVote,
  depth,
}: {
  node: CommentNode;
  onReply: (content: string, parentId: string) => Promise<void> | void;
  onVote: (id: string, dir: 1 | -1 | 0) => Promise<void> | void;
  depth: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState("");
  const canReply = depth < 6;

  const indentClass =
    depth > 0 ? "ml-4 sm:ml-6 border-l border-blue-900/80 pl-3 sm:pl-4" : "";

  return (
    <li className={indentClass}>
      <div className="rounded-xl border border-blue-900/80 bg-blue-950/60 px-3 py-2.5 sm:px-4 sm:py-3 flex gap-3">
        <div className="flex flex-col items-center text-slate-400 pt-1">
          <button
            className="px-1 hover:text-sky-300 text-sm leading-none"
            onClick={() => onVote(node._id, 1)}
          >
            ▲
          </button>
          <div className="text-[11px] text-slate-300">{node.score}</div>
          <button
            className="px-1 hover:text-sky-300 text-sm leading-none"
            onClick={() => onVote(node._id, -1)}
          >
            ▼
          </button>
        </div>
        <div className="flex-1">
          <div className="text-xs sm:text-sm text-slate-300">
            <span className="font-semibold text-slate-100">
              {node.username ?? "User"}
            </span>
            <span className="ml-2 text-[11px] text-slate-500">
              {new Date(node.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-100 whitespace-pre-wrap">
            {node.content}
          </div>
          <div className="mt-1 text-[11px] sm:text-xs text-slate-400 flex gap-3">
            {canReply && (
              <button
                className="hover:text-sky-400"
                onClick={() => setShowReply((s) => !s)}
              >
                Reply
              </button>
            )}
            <button
              className="hover:text-sky-400"
              onClick={() => onVote(node._id, 0)}
            >
              Clear vote
            </button>
          </div>

          {showReply && canReply && (
            <div className="mt-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                className="w-full rounded-lg bg-slate-950/80 border border-blue-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-sky-500"
                rows={2}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-md bg-sky-600 text-xs sm:text-sm font-medium text-white disabled:opacity-50"
                  disabled={text.trim().length === 0}
                  onClick={async () => {
                    const trimmed = text.trim();
                    if (trimmed.length === 0) return;
                    await onReply(trimmed, node._id);
                    setShowReply(false);
                    setText("");
                  }}
                >
                  Submit
                </button>
                <button
                  className="px-3 py-1.5 rounded-md border border-blue-800 text-xs sm:text-sm text-slate-200"
                  onClick={() => setShowReply(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {node.children && node.children.length > 0 && (
            <ul className="mt-3 space-y-3">
              {node.children.map((c) => (
                <CommentItem
                  key={c._id}
                  node={c}
                  onReply={onReply}
                  onVote={onVote}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
