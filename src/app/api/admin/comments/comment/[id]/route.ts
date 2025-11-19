//Animaru\src\app\api\admin\comments\comment\[id]\route.ts

// src/app/api/admin/comments/comment/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "../../../../_lib/auth";
import { getCommentsCollection } from "../../../../../../lib/mongo";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin(req);

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid comment id" },
        { status: 400 },
      );
    }

    const coll = await getCommentsCollection();
    const result = await coll.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to delete comment" },
      { status: e.status ?? 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin(req);

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid comment id" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as { isSpoiler?: boolean };
    const isSpoiler = !!body.isSpoiler;

    const coll = await getCommentsCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { isSpoiler } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, isSpoiler });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to update comment" },
      { status: e.status ?? 500 },
    );
  }
}
