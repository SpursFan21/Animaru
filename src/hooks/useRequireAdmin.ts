//src\hooks\useRequireAdmin.ts

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

export function useRequireAdmin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) router.replace("/login");
        return;
      }

      const uid = session.user.id;
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        router.replace("/");
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}
