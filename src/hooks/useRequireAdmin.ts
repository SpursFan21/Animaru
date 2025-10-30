//src\hooks\useRequireAdmin.ts

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

export function useRequireAdmin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const decidedRef = useRef(false); // ensure we decide only once

  useEffect(() => {
    let cancelled = false;

    async function decide(session: any | null) {
      if (cancelled || decidedRef.current) return;

      if (!session?.user) {
        // no session after initial hydration → redirect to login once
        decidedRef.current = true;
        router.replace("/login");
        return;
      }

      // session exists → check admin row
      const uid = session.user.id as string;
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled || decidedRef.current) return;

      if (error || !data) {
        decidedRef.current = true;
        router.replace("/");
        return;
      }

      decidedRef.current = true;
      setReady(true);
    }

    (async () => {
      // 1) Try current cached session (may be null on first tick)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await decide(data.session);
      }

      // 2) Wait for INITIAL_SESSION so we don't prematurely redirect
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          void decide(session);
        }
        if (event === "SIGNED_OUT" && !decidedRef.current) {
          decidedRef.current = true;
          router.replace("/login");
        }
      });

      // If nothing fires in a short time and we still have no session,
      // we’ll wait for the auth event (avoids false negatives).
      return () => sub.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}
