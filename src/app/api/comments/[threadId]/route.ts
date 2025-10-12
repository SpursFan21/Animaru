// Animaru/src/app/api/comments/[threadId]/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import type { CommentDoc } from "../../../../lib/mongo";
import { ObjectId, type OptionalId } from "mongodb";

export const dynamic = "force-dynamic";

// Simple header-based auth (replace with Supabase helpers later)
async function getUserId(req: NextRequest): Promise<string | null> {
  const fromHeader = req.headers.get("x-user-id");
  return fromHeader ?? null; // use ?? to avoid lint warning
}

// Input body type
interface CommentBody {
  content?: string;
  parentId?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
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

  // Safely parse body
  const body = (await req.json()) as CommentBody;

  const content = (body.content ?? "").toString().trim();
  const parentId = body.parentId ? String(body.parentId) : null;
  const username = body.username ?? null;
  const avatarUrl = body.avatarUrl ?? null;

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
  const insert: OptionalId<CommentDoc> = {
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

  await comments.insertOne(insert);
  const saved = await comments.findOne({ threadId, content, createdAt: now });
  return NextResponse.json({ comment: saved });
}
