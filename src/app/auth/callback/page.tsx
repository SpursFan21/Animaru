//Animaru\src\app\auth\callback\page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // If the session was just established, AuthBootstrap will sync Redux.
    // We just bounce the user to where they came from or home.
    const next = sessionStorage.getItem("redirect-to") || "/";
    sessionStorage.removeItem("redirect-to");

    // Optionally ensure session is settled before redirect (not strictly required)
    supabase.auth.getSession().finally(() => {
      router.replace(next);
    });
  }, [router]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <p className="text-slate-300">Signing you in…</p>
    </div>
  );
}