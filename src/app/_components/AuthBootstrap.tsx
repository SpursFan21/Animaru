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

    // IMPORTANT: do NOT clear the user here if session is null.
    // We only "set" eagerly if a session already exists.
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      if (!mounted) return;

      if (session?.user) {
        dispatch(setUser(session.user));
      }
      // Always sync cookies on first load so server can read them
      await postAuthSync("BOOTSTRAP", session);
    };

    void bootstrap();

    // Let INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED be the single source of truth.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (user) dispatch(setUser(user));
          else dispatch(clearUser());
          void postAuthSync(event, session);
        }

        if (event === "SIGNED_OUT") {
          dispatch(clearUser());
          void postAuthSync(event, session);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
