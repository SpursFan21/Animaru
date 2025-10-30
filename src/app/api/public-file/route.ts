//src/app/api/public-file/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import mime from "mime";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = u.searchParams.get("path");
  if (!p || !fs.existsSync(p)) return new NextResponse("Not found", { status: 404 });
  const buf = await fs.promises.readFile(p);
  return new NextResponse(buf, {
    headers: { "Content-Type": mime.getType(p) || "application/octet-stream" },
  });
}
