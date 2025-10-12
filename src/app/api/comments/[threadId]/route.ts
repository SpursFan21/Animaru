// Animaru/src/app/api/comments/[threadId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import type { CommentDoc } from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// Simple header-based auth (replace with Supabase helpers later)
async function getUserId(req: NextRequest) {
  const fromHeader = req.headers.get("x-user-id");
  return fromHeader || null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await ctx.params;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const db = await getDb();
  const docs = await db
    .collection<CommentDoc>("comments")
    .find({ threadId })
    .sort({ path: 1, createdAt: 1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ comments: docs });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await ctx.params;

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const content: string = (body?.content ?? "").toString().trim();
  const parentId: string | null = body?.parentId ? String(body.parentId) : null;
  const username: string | null = body?.username ?? null;
  const avatarUrl: string | null = body?.avatarUrl ?? null;

  if (!content || content.length < 1 || content.length > 4000) {
    return NextResponse.json({ error: "Content length invalid" }, { status: 400 });
  }

  const db = await getDb();
  const comments = db.collection<CommentDoc>("comments");

  let path: string[] = [];
  if (parentId) {
    const parent = await comments.findOne({ _id: new ObjectId(parentId) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }
    path = [...parent.path, parent._id.toString()];
  }

  const now = new Date();
  const insert: CommentDoc = {
    threadId,
    parentId,
    path,
    content,
    userId,
    username,
    avatarUrl,
    score: 0,
    votes: {},
    createdAt: now,
    updatedAt: now,
  };

  const res = await comments.insertOne(insert as any);
  const saved = await comments.findOne({ _id: res.insertedId });
  return NextResponse.json({ comment: saved });
}
