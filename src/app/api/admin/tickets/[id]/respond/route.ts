//Animaru\src\app\admins\tickets\[id]\respond\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTicketCollection } from "../../../../../../lib/tickets";
import { requireAdmin } from "../../../../_lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    
    const { userId: adminId } = await requireAdmin(req);
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
    const res = await coll.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: {
          responses: {
            fromAdmin: true,
            adminId,
            message,
            timestamp: new Date(),
          },
        },
      },
    );

    if (res.matchedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Response added" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to respond to ticket" },
      { status: e.status ?? 500 },
    );
  }
}
