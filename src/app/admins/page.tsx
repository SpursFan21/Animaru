//src/app/admins/page.tsx


// src/app/admins/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

export default function AdminHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) must be logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) router.replace("/login");
        return;
      }

      // 2) must be in public.admins
      const uid = session.user.id;
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        router.replace("/"); // logged in but not admin
        return;
      }

      setAllowed(true);
      setChecking(false);
    })();

    return () => { cancelled = true; };
  }, [router]);

  if (checking && !allowed) {
    return <p className="text-slate-400">Checking admin access…</p>;
  }

  // ✅ Admin content
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-slate-400">Access confirmed. Add tools here next.</p>
    </div>
  );
}
