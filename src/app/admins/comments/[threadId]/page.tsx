//Animaru\src\app\admins\comments\[threadId]\page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useMemo } from "react";

type RawId = unknown;

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
  isSpoiler?: boolean;
};

type ApiResponse = {
  comments: RawComment[];
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
  isSpoiler?: boolean;
  children?: CommentNode[];
};

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to load comments (${res.status})`);
  }
  return (await res.json()) as ApiResponse;
};

export default function AdminThreadPage() {
  // Params are guaranteed for this route, so type them as string
  const params = useParams<{ threadId: string }>();
  const router = useRouter();

  // threadId in the URL is encoded; normalize it here
  const threadId = decodeURIComponent(params.threadId);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    threadId ? `/api/admin/comments/threads/${encodeURIComponent(threadId)}` : null,
    fetcher,
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
        isSpoiler: d.isSpoiler,
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

  async function deleteComment(id: string) {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/comments/comment/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to delete comment.");
      return;
    }
    await mutate();
  }

  async function toggleSpoiler(id: string, current?: boolean) {
    const res = await fetch(`/api/admin/comments/comment/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSpoiler: !current }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to update spoiler flag.");
      return;
    }
    await mutate();
  }

  const [animeId, epStr] = (threadId ?? "").split(":");

  return (
    <main className="min-h-[70vh] bg-blue-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-10">
        <button
          type="button"
          onClick={() => router.push("/admins/comments")}
          className="text-xs text-sky-400 hover:underline mb-3"
        >
          ← Back to threads
        </button>

        <h1 className="text-2xl font-extrabold mb-1">Moderate Comments</h1>
        <p className="text-slate-400 text-sm mb-4">
          Thread: <span className="font-mono">{threadId}</span>{" "}
          <span className="text-slate-500">
            (Anime ID: {animeId ?? "?"} • Episode: {epStr ?? "?"})
          </span>
        </p>

        {isLoading && <p className="text-sm text-slate-300">Loading comments…</p>}
        {error && (
          <p className="text-sm text-red-300">
            {(error as Error).message ?? "Failed to load comments."}
          </p>
        )}

        {!isLoading && !error && tree.length === 0 && (
          <p className="text-sm text-slate-400">No comments on this thread.</p>
        )}

        {tree.length > 0 && (
          <ul className="mt-4 space-y-4">
            {tree.map((n) => (
              <AdminCommentItem
                key={n._id}
                node={n}
                depth={0}
                onDelete={deleteComment}
                onToggleSpoiler={toggleSpoiler}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function AdminCommentItem({
  node,
  depth,
  onDelete,
  onToggleSpoiler,
}: {
  node: CommentNode;
  depth: number;
  onDelete: (id: string) => Promise<void> | void;
  onToggleSpoiler: (id: string, current?: boolean) => Promise<void> | void;
}) {
  const indentClass = depth > 0 ? "ml-5 border-l border-blue-900 pl-4" : "";

  return (
    <li className={indentClass}>
      <div className="rounded-lg border border-blue-800 bg-blue-950/50 p-3">
        <div className="flex justify-between gap-3">
          <div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-slate-100">
                {node.username ?? "User"}
              </span>{" "}
              <span className="text-slate-500">({node.userId})</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {new Date(node.createdAt).toLocaleString()} • score {node.score}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-start justify-end">
            {node.isSpoiler && (
              <span className="inline-flex items-center rounded-full bg-amber-900/60 border border-amber-500/80 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                SPOILER
              </span>
            )}
            <button
              className="text-[11px] px-2 py-1 rounded-md border border-amber-500/80 text-amber-100 hover:bg-amber-900/50"
              onClick={() => onToggleSpoiler(node._id, node.isSpoiler)}
            >
              {node.isSpoiler ? "Unmark spoiler" : "Mark as spoiler"}
            </button>
            <button
              className="text-[11px] px-2 py-1 rounded-md border border-red-600/80 text-red-200 hover:bg-red-900/60"
              onClick={() => onDelete(node._id)}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-slate-100 whitespace-pre-wrap">
          {node.content}
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <ul className="mt-3 space-y-3">
          {node.children.map((c) => (
            <AdminCommentItem
              key={c._id}
              node={c}
              depth={depth + 1}
              onDelete={onDelete}
              onToggleSpoiler={onToggleSpoiler}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
