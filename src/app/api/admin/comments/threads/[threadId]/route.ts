//Animaru\src\app\api\admin\comments\threads\[threadId]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../_lib/auth";
import { getCommentsCollection } from "../../../../../../lib/mongo";

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } },
) {
  try {
    await requireAdmin(req);

    const threadId = decodeURIComponent(params.threadId);
    const coll = await getCommentsCollection();

    const docs = await coll
      .find({ threadId })
      .sort({ createdAt: 1 })
      .toArray();

    const comments = docs.map((d: any) => ({
      _id: d._id,
      threadId: d.threadId,
      parentId: d.parentId ?? null,
      path: d.path ?? [],
      content: d.content,
      userId: d.userId,
      username: d.username ?? null,
      avatarUrl: d.avatarUrl ?? null,
      score: d.score ?? 0,
      createdAt:
        d.createdAt instanceof Date
          ? d.createdAt.toISOString()
          : d.createdAt,
      updatedAt:
        d.updatedAt instanceof Date
          ? d.updatedAt.toISOString()
          : d.updatedAt,
      isSpoiler: d.isSpoiler ?? false,
    }));

    return NextResponse.json({ comments });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to load comments" },
      { status: e.status ?? 500 },
    );
  }
}
