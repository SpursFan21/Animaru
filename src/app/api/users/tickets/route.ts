// src/app/api/users/tickets/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTicketCollection } from "../../../../lib/tickets";
import { requireUser } from "../../_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireUser(req);
    const coll = await getTicketCollection();

    const tickets = await coll
      .find({ userId })
      .sort({ status: 1, createdAt: -1 })
      .toArray();

    const out = tickets.map((t) => ({
      id: t._id!.toString(),
      subject: t.subject,
      message: t.message,
      status: t.status,
      responses: t.responses ?? [],
      createdAt: t.createdAt,
    }));

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to fetch tickets" },
      { status: e.status ?? 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser(req);
    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message required" },
        { status: 400 },
      );
    }

    const coll = await getTicketCollection();
    const now = new Date();

    const result = await coll.insertOne({
      userId,
      subject,
      message,
      status: "open",
      responses: [],
      createdAt: now,
    });

    return NextResponse.json(
      { id: result.insertedId.toString(), message: "Ticket submitted" },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to submit ticket" },
      { status: e.status ?? 500 },
    );
  }
}
