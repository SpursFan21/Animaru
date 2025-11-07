//Animaru\src\app\api\admin\subtitles\list\route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VttRow = {
  name: string;
  size: number;
  updatedAt: string | null;
  key: string;            // "sb:<key>" for Supabase, "local:<file>" for local
  publicUrl: string | null;
  source: "supabase" | "local";
};

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUBTITLE_BUCKET || "subtitles";
    const prefix = process.env.SUBTITLE_PREFIX || "";

    // --- list from Supabase
    let supaRows: VttRow[] = [];
    if (url && svc) {
      const supabase = createClient(url, svc, { auth: { persistSession: false } });
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;

      supaRows =
        data
          ?.filter((f) => f.name.toLowerCase().endsWith(".vtt"))
          .map((f) => {
            const { data: pub } = supabase
              .storage
              .from(bucket)
              .getPublicUrl(`${prefix}${f.name}`);
            return {
              name: f.name,
              size: (f as any).metadata?.size ?? 0,
              updatedAt: (f as any).updated_at ?? (f as any).created_at ?? null,
              key: `sb:${prefix}${f.name}`,
              publicUrl: pub?.publicUrl ?? null,
              source: "supabase" as const,
            };
          }) ?? [];
    }

    // --- list from local /media/subtitles
    const localDir =
      process.env.SUBTITLE_LOCAL_DIR
        ? path.isAbsolute(process.env.SUBTITLE_LOCAL_DIR)
          ? process.env.SUBTITLE_LOCAL_DIR
          : path.join(process.cwd(), process.env.SUBTITLE_LOCAL_DIR)
        : path.join(process.cwd(), "media", "subtitles");

    let localRows: VttRow[] = [];
    try {
      if (fs.existsSync(localDir)) {
        const files = fs.readdirSync(localDir)
          .filter((f) => f.toLowerCase().endsWith(".vtt"));
        localRows = files.map((f) => {
          let size = 0, mtime: string | null = null;
          try {
            const st = fs.statSync(path.join(localDir, f));
            size = st.size;
            mtime = st.mtime.toISOString();
          } catch {}
          return {
            name: f,
            size,
            updatedAt: mtime,
            key: `local:${f}`,       // we don't expose absolute paths to the client
            publicUrl: null,
            source: "local" as const,
          };
        });
      }
    } catch {
      // ignore local reading errors
    }

    // combine; local first, then supabase
    const rows: VttRow[] = [...localRows, ...supaRows];

    return NextResponse.json({ ok: true, files: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
