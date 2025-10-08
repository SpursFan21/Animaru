//Animaru\src\app\_components\CommentsSection.tsx

"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string, userId?: string) =>
  fetch(url, { headers: userId ? { "x-user-id": userId } : {} }).then((r) => r.json());

export type CommentsProps = {
  threadId: string;          // `${animeId}:${episodeNumber}`
  userId: string | null;     // Supabase uid (null if guest)
  username?: string | null;
  avatarUrl?: string | null;
};

type CommentNode = {
  _id: string;
  threadId: string;
  parentId: string | null;
  path: string[];
  content: string;
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  score: number;
  createdAt: string;
  updatedAt: string;
  children?: CommentNode[];
};

export default function CommentsSection({ threadId, userId, username, avatarUrl }: CommentsProps) {
  const { data, mutate, isLoading } = useSWR(
    `/api/comments/${encodeURIComponent(threadId)}`,
    (u) => fetcher(u, userId ?? undefined)
  );

  const flat: CommentNode[] = (data?.comments ?? []).map((d: any) => ({
    ...d,
    _id: d._id?.toString?.() ?? d._id,
  }));

  // Build a tree
  const tree = useMemo(() => {
    const byId = new Map<string, CommentNode>();
    flat.forEach((n) => byId.set(n._id, { ...n, children: [] }));
    const roots: CommentNode[] = [];
    flat.forEach((n) => {
      const node = byId.get(n._id)!;
      if (n.parentId && byId.get(n.parentId)) byId.get(n.parentId)!.children!.push(node);
      else roots.push(node);
    });
    return roots;
  }, [flat]);

  const [newText, setNewText] = useState("");

  async function submit(content: string, parentId: string | null) {
    if (!userId) return alert("Please sign in to comment.");
    const res = await fetch(`/api/comments/${encodeURIComponent(threadId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ content, parentId, username, avatarUrl }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to post");
      return;
    }
    await mutate();
  }

  async function vote(commentId: string, dir: 1 | -1 | 0) {
    if (!userId) return alert("Please sign in to vote.");
    const res = await fetch("/api/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ commentId, direction: dir }),
    });
    if (res.ok) await mutate();
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-100 mb-3">Comments</h2>

      {/* root composer */}
      <div className="rounded-lg border border-blue-900 p-3 bg-blue-950/40">
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={userId ? "Write a comment…" : "Sign in to comment"}
          className="w-full rounded-md bg-blue-950 border border-blue-900 p-2 outline-none focus:border-sky-500"
          rows={3}
          disabled={!userId}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => newText.trim() && submit(newText.trim(), null).then(() => setNewText(""))}
            className="px-3 py-1.5 rounded-md bg-sky-600 text-white disabled:opacity-50"
            disabled={!userId || newText.trim().length === 0}
          >
            Post
          </button>
        </div>
      </div>

      {/* list */}
      <div className="mt-4">
        {isLoading ? (
          <p className="text-slate-300">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="text-slate-400">Be the first to comment.</p>
        ) : (
          <ul className="space-y-4">
            {tree.map((n) => (
              <CommentItem
                key={n._id}
                node={n}
                onReply={(c, pid) => submit(c, pid)}
                onVote={vote}
                depth={0}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  node,
  onReply,
  onVote,
  depth,
}: {
  node: CommentNode;
  onReply: (content: string, parentId: string) => void;
  onVote: (id: string, dir: 1 | -1 | 0) => void;
  depth: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState("");
  const canReply = depth < 6;

  return (
    <li>
      <div className="flex gap-3">
        <div className="flex flex-col items-center text-slate-400">
          <button className="px-1" onClick={() => onVote(node._id, 1)}>▲</button>
          <div className="text-xs text-slate-300">{node.score}</div>
          <button className="px-1" onClick={() => onVote(node._id, -1)}>▼</button>
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-slate-100">{node.username || "User"}</span>
            <span className="ml-2 text-xs text-slate-400">
              {new Date(node.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-slate-200 whitespace-pre-wrap">{node.content}</div>
          <div className="mt-1 text-xs text-slate-400 flex gap-3">
            {canReply && (
              <button className="hover:text-sky-400" onClick={() => setShowReply((s) => !s)}>
                Reply
              </button>
            )}
            <button className="hover:text-sky-400" onClick={() => onVote(node._id, 0)}>
              Clear vote
            </button>
          </div>

          {showReply && canReply && (
            <div className="mt-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                className="w-full rounded-md bg-blue-950 border border-blue-900 p-2 outline-none focus:border-sky-500"
                rows={2}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-md bg-sky-600 text-white disabled:opacity-50"
                  disabled={text.trim().length === 0}
                  onClick={() => text.trim() && onReply(text.trim(), node._id)}
                >
                  Submit
                </button>
                <button
                  className="px-3 py-1.5 rounded-md border border-blue-800"
                  onClick={() => setShowReply(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {node.children && node.children.length > 0 && (
            <ul className="mt-3 ml-5 border-l border-blue-900 pl-4 space-y-3">
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
