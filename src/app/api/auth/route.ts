//src\app\api\auth\route.ts

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

async function getServerClientForRoute() {
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

export async function POST(req: NextRequest) {
  const supabase = await getServerClientForRoute();

  const { event, session } = (await req.json()) as {
    event:
      | "SIGNED_IN"
      | "SIGNED_OUT"
      | "TOKEN_REFRESHED"
      | "USER_UPDATED"
      | string;
    session: any | null;
  };

  try {
    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED" ||
      event === "BOOTSTRAP"
    ) {
      if (session) await supabase.auth.setSession(session);
    } else if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}


