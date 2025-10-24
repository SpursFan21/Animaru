//src\app\api\admin\videos\route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * MODE:
 *  - local: uses MEDIA_STORAGE_PATH as a folder path (e.g. ./media/videos)
 *  - supabase: uses MEDIA_STORAGE_PATH as "<bucket>" or "<bucket>/<prefix>"
 */
const STORAGE_MODE = process.env.MEDIA_STORAGE_MODE ?? "local";
const STORAGE_PATH = process.env.MEDIA_STORAGE_PATH ?? "./media/videos";

const ROOT_DIR = process.cwd();
const VIDEO_DIR = path.isAbsolute(STORAGE_PATH)
  ? STORAGE_PATH
  : path.join(ROOT_DIR, STORAGE_PATH);

// Writable cookies for Route Handlers (NOT the RSC helper)
async function getSupabaseForRoute() {
  const cookieStore = await nextCookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/** Parse "bucket[/optional/prefix/]" into { bucket, prefix } – always non-empty bucket */
function parseBucketPrefix(p: string): { bucket: string; prefix: string } {
  const [maybeBucket, ...rest] = p.split("/").filter(Boolean);
  const bucket = maybeBucket && maybeBucket.length ? maybeBucket : "videos";
  const prefix = rest.length ? rest.join("/") + "/" : "";
  return { bucket, prefix };
}

async function assertAdmin() {
  const supabase = await getSupabaseForRoute();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data && !error;
}

/** ---------- LIST ---------- */
async function listFilesLocal() {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  const names = await fs.readdir(VIDEO_DIR);
  const rows = await Promise.all(
    names
      .filter((n) => n.toLowerCase().endsWith(".mp4"))
      .map(async (name) => {
        const stat = await fs.stat(path.join(VIDEO_DIR, name));
        return { name, size: stat.size, mtimeMs: stat.mtimeMs };
      })
  );
  return rows.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

async function listFilesSupabase() {
  const supabase = await getSupabaseForRoute();
  const { bucket, prefix } = parseBucketPrefix(STORAGE_PATH);

  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(error.message);

  const rows =
    data
      ?.filter((f) => f.name.toLowerCase().endsWith(".mp4"))
      .map((f) => ({
        name: f.name,
        size: (f as any).metadata?.size ?? 0,
        mtimeMs: new Date(
          (f as any).updated_at ?? (f as any).created_at ?? Date.now()
        ).getTime(),
      })) ?? [];

  rows.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return rows;
}

async function listFiles() {
  return STORAGE_MODE === "supabase" ? listFilesSupabase() : listFilesLocal();
}

/** ---------- UPLOAD ---------- */
async function uploadLocal(file: File) {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const rawName = file.name || "upload.mp4";
  const safeName = rawName.replace(/[\\/:*?"<>|]+/g, "_");
  await fs.writeFile(path.join(VIDEO_DIR, safeName), buf);
  return { name: safeName };
}

async function uploadSupabase(file: File) {
  const supabase = await getSupabaseForRoute();
  const { bucket, prefix } = parseBucketPrefix(STORAGE_PATH);

  const buf = Buffer.from(await file.arrayBuffer());
  const rawName = file.name || "upload.mp4";
  const safeName = rawName.replace(/[\\/:*?"<>|]+/g, "_");
  const key = `${prefix}${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, buf, { upsert: true, contentType: "video/mp4" });
  if (error) throw new Error(error.message);

  return { name: safeName };
}

/** ---------- DELETE ---------- */
async function deleteLocal(name: string) {
  await fs.unlink(path.join(VIDEO_DIR, name));
}

async function deleteSupabase(name: string) {
  const supabase = await getSupabaseForRoute();
  const { bucket, prefix } = parseBucketPrefix(STORAGE_PATH);
  const key = `${prefix}${name}`;
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) throw new Error(error.message);
}

/** ---------- HTTP HANDLERS ---------- */
export async function GET() {
  if (!(await assertAdmin()))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  try {
    const files = await listFiles();
    return NextResponse.json({ ok: true, files });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const result =
      STORAGE_MODE === "supabase"
        ? await uploadSupabase(file as File)
        : await uploadLocal(file as File);

    return NextResponse.json({ ok: true, name: result.name });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ ok: false, error: "Missing name" }, { status: 400 });
    }

    if (STORAGE_MODE === "supabase") {
      await deleteSupabase(name);
    } else {
      await deleteLocal(name);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const isNotFound = e?.code === "ENOENT";
    return NextResponse.json(
      { ok: false, error: isNotFound ? "Not found" : (e as Error).message },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
