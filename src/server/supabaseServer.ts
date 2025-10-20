//src\server\supabaseServer.ts

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // READ-ONLY in Server Components
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // NO-OP writes to avoid Next 15 “only in actions/route handlers” error
        set(_name: string, _value: string, _options: CookieOptions) {
          /* no-op in RSC */
        },
        remove(_name: string, _options: CookieOptions) {
          /* no-op in RSC */
        },
      },
    }
  );
}
