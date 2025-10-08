//Animaru\src\app\api\comments\vote\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import type { CommentDoc } from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId: string | null = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId: string = String(body?.commentId ?? "");
  const direction: 1 | -1 | 0 = [1, -1, 0].includes(body?.direction) ? body.direction : 0;
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const db = await getDb();
  const col = db.collection<CommentDoc>("comments");
  const doc = await col.findOne({ _id: new ObjectId(commentId) });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prev = doc.votes[userId] ?? 0;
  const next = direction; // 1, -1, or 0
  const delta = (next as number) - (prev as number);

  const update: any = {
    $set: { updatedAt: new Date() },
    $inc: { score: delta },
  };
  if (next === 0) {
    update.$unset = { [`votes.${userId}`]: "" };
  } else {
    update.$set[`votes.${userId}`] = next;
  }

  await col.updateOne({ _id: doc._id }, update);
  const fresh = await col.findOne({ _id: doc._id });
  return NextResponse.json({ comment: fresh });
}
