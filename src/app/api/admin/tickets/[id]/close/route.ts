//Animaru\src\app\admins\tickets\[id]\close\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTicketCollection } from "../../../../../../lib/tickets";
import { requireAdmin } from "../../../../_lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const coll = await getTicketCollection();
    const res = await coll.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { status: "closed" } },
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Ticket closed" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to close ticket" },
      { status: e.status ?? 500 },
    );
  }
}
