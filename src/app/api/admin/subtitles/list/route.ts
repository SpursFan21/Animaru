//Animaru\src\app\api\admin\subtitles\list\route.ts

// src/app/api/admin/subtitles/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !svc) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
    }
    const bucket = process.env.SUBTITLE_BUCKET || "subtitles";
    const prefix = process.env.SUBTITLE_PREFIX || ""; // optional folder

    const supabase = createClient(url, svc, { auth: { persistSession: false } });

    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    const rows =
      data
        ?.filter(f => f.name.toLowerCase().endsWith(".vtt"))
        .map(f => {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(`${prefix}${f.name}`);
          return {
            name: f.name,
            size: (f as any).metadata?.size ?? 0,
            updatedAt: (f as any).updated_at ?? (f as any).created_at ?? null,
            key: `${prefix}${f.name}`,
            publicUrl: pub?.publicUrl ?? null,
          };
        }) ?? [];

    return NextResponse.json({ ok: true, files: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
