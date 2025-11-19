//Animaru\src\app\api\users\tickets\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTicketCollection } from "../../../../../lib/tickets";
import { requireUser } from "../../../_lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireUser(req);
    const coll = await getTicketCollection();

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const ticket = await coll.findOne({
      _id: new ObjectId(params.id),
      userId,
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: ticket._id!.toString(),
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      responses: ticket.responses ?? [],
      createdAt: ticket.createdAt,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to fetch ticket" },
      { status: e.status ?? 500 },
    );
  }
}

