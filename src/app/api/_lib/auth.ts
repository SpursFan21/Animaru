//Animaru\src\app\api\_lib\auth.ts

import type { NextRequest } from "next/server";
import { cookies as nextCookies } from "next/headers";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

async function getServerSupabase() {
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

async function getUserOrThrow(): Promise<User> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  return data.user;
}

export async function requireUser(_req: NextRequest) {
  const user = await getUserOrThrow();
  return { userId: user.id, user };
}

export async function requireAdmin(req: NextRequest) {
  const { user } = await requireUser(req);

  // 1) Check metadata flags
  let isAdmin =
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.is_admin === true;

  // 2) If not admin by metadata, fall back to the `admins` table
  if (!isAdmin) {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return { userId: user.id, user };
}
