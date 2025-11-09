// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  // Important on Next 15: forward request headers into the next response,
  // so any Set-Cookie written by Supabase sticks on the original response.
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  const supabase = createMiddlewareClient({ req, res });

  // This call refreshes access_token cookies if the refresh token cookie is valid.
  await supabase.auth.getSession();

  return res;
}

// Make sure /admins itself is matched.
export const config = {
  matcher: ["/admins", "/admins/:path*", "/api/admin/:path*"],
};
