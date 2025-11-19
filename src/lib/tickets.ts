//Animaru\src\lib\tickets.ts

import { ObjectId } from "mongodb";
import { getDb } from "./mongo";

export type TicketResponseDoc = {
  fromAdmin?: boolean;          // user-service compat
  adminId?: string | null;      // admin-service compat
  message: string;
  timestamp: Date;
};

export type TicketDoc = {
  _id?: ObjectId;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  responses: TicketResponseDoc[];
  createdAt: Date;
};

export async function getTicketCollection() {
  const db = await getDb();
  const coll = db.collection<TicketDoc>("tickets");

  // Idempotent indexes
  await coll.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { status: 1, createdAt: -1 } },
  ]);

  return coll;
}
