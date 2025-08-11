//Animaru\src\app\auth\callback\page.tsx

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const next = sessionStorage.getItem("redirect-to") ?? "/";
      sessionStorage.removeItem("redirect-to");
      try {
        await supabase.auth.getSession(); // settle session
      } finally {
        if (mounted) router.replace(next);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <p className="text-slate-300">Signing you in…</p>
    </div>
  );
}
