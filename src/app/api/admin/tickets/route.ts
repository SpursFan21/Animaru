//Animaru\src\app\api\admin\tickets\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTicketCollection } from "../../../../lib/tickets";
import { requireAdmin } from "../../../../app/api/_lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req); // verify admin via Supabase session

    const coll = await getTicketCollection();
    const tickets = await coll.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(
      tickets.map((t) => ({
        _id: t._id!.toString(),
        userId: t.userId,
        subject: t.subject,
        message: t.message,
        status: t.status,
        responses: t.responses ?? [],
        createdAt: t.createdAt,
      })),
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to fetch tickets" },
      { status: e.status ?? 500 },
    );
  }
}
