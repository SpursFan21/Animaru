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

    const syncInitial = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      if (!mounted) return;
      if (u) {
        dispatch(setUser(u));
      } else {
        dispatch(clearUser());
      }
    };

    // mark intentionally-ignored promise so eslint is happy
    void syncInitial();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      if (u) {
        dispatch(setUser(u));
      } else {
        dispatch(clearUser());
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
