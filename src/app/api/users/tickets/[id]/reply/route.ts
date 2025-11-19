//Animaru\src\app\api\users\tickets\[id]\reply\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTicketCollection } from "../../../../../../lib/tickets";
import { requireUser } from "../../../../_lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireUser(req);
    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 },
      );
    }

    const coll = await getTicketCollection();

    const updateResult = await coll.updateOne(
      { _id: new ObjectId(params.id), userId },
      {
        $push: {
          responses: {
            fromAdmin: false,
            adminId: null,
            message,
            timestamp: new Date(),
          },
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Reply added" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to reply to ticket" },
      { status: e.status ?? 500 },
    );
  }
}
