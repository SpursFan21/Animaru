//Animaru\src\app\api\comments\vote\route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import type { CommentDoc } from "../../../../lib/mongo";
import { ObjectId, type UpdateFilter } from "mongodb";

export const dynamic = "force-dynamic";

type VoteBody = {
  commentId?: string;
  direction?: unknown;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VoteBody;
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commentId = body.commentId?.toString() ?? "";

  // Coerce to a safe tri-state: -1, 0, or 1
  const rawDir = Number(body.direction);
  const direction: 1 | -1 | 0 = rawDir === 1 ? 1 : rawDir === -1 ? -1 : 0;

  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  const db = await getDb();
  const col = db.collection<CommentDoc>("comments");
  const doc = await col.findOne({ _id: new ObjectId(commentId) });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prev = doc.votes?.[userId] ?? 0;
  const next = direction;
  const delta = next - prev;

  const update: UpdateFilter<CommentDoc> = {
    $set: { updatedAt: new Date() },
    $inc: { score: delta },
  };

  if (next === 0) {
    (update.$unset ??= {})[`votes.${userId}`] = "";
  } else {
    (update.$set ??= {})[`votes.${userId}`] = next;
  }

  await col.updateOne({ _id: doc._id }, update);
  const fresh = await col.findOne({ _id: doc._id });

  return NextResponse.json({ comment: fresh });
}
