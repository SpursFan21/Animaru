//Animaru\src\app\_components\AuthBootstrap.tsx

"use client";

import { useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "../../redux/authSlice";

export default function AuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;

    const postAuthSync = async (event: string, session: any) => {
      try {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, session }),
        });
      } catch {
        /* ignore */
      }
    };

    const syncInitial = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      const u = session?.user ?? null;

      if (!mounted) return;

      if (u) {
        dispatch(setUser(u));
      } else {
        dispatch(clearUser());
      }

      // IMPORTANT: one-shot bootstrap so server has the same cookies
      await postAuthSync("BOOTSTRAP", session);
    };

    void syncInitial();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      if (u) {
        dispatch(setUser(u));
      } else {
        dispatch(clearUser());
      }

      // Only sync meaningful events (these come from Supabase)
      // They won't cause client loops.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void postAuthSync(event, session);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
