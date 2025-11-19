//Animaru\src\lib\mongo.ts

import { MongoClient, type Db, type ObjectId } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!process.env.MONGODB_DB) throw new Error("MONGODB_DB missing");

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DB);

  // Helpful indexes (idempotent)
  await db.collection("comments").createIndexes([
    { key: { threadId: 1, createdAt: -1 } },
    { key: { parentId: 1 } },
    { key: { path: 1 } },
    { key: { score: -1, updatedAt: -1 } },
  ]);

  return db;
}

export type CommentDoc = {
  _id?: ObjectId | string;
  threadId: string;
  parentId: string | null;
  path: string[];
  content: string;
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  score: number;
  votes: Record<string, 1 | -1>;
  createdAt: Date;
  updatedAt: Date;
};

/** helper collection getter */
export async function getCommentsCollection() {
  const db = await getDb();
  return db.collection<CommentDoc>("comments");
}
