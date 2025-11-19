//Animaru\src\app\api\admin\comments\threads\route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../_lib/auth";
import { getCommentsCollection } from "../../../../../lib/mongo";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const coll = await getCommentsCollection();

    const agg = await coll
      .aggregate([
        {
          $group: {
            _id: "$threadId",
            commentCount: { $sum: 1 },
            lastCommentAt: { $max: "$createdAt" },
          },
        },
        { $sort: { lastCommentAt: -1 } },
      ])
      .toArray();

    const threads = agg.map((t: any) => ({
      threadId: t._id as string,
      commentCount: t.commentCount as number,
      lastCommentAt:
        t.lastCommentAt instanceof Date
          ? t.lastCommentAt.toISOString()
          : t.lastCommentAt ?? null,
    }));

    return NextResponse.json({ threads });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to load comment threads" },
      { status: e.status ?? 500 },
    );
  }
}
