//Animaru\src\app\_components\AuthBootstrap.tsx

"use client";

import { useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "../../redux/authSlice";

export default function AuthBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1) Set initial state from any persisted session
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      if (u) dispatch(setUser(u));
      else dispatch(clearUser());
    });

    // 2) Subscribe to auth changes (sign in, sign out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      if (u) dispatch(setUser(u));
      else dispatch(clearUser());
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  // This component just wires state; it renders nothing.
  return null;
}
