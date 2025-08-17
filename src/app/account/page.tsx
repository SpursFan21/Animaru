//src/app/account/page.tsx

// src/app/account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/button";
import { User as UserIcon, Mail, Lock } from "lucide-react";

type Profile = {
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const user = useSelector<RootState, User | null>((s) => s.auth.user);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const displayEmail = user?.email ?? "";
  const userId = user?.id;

  // If not signed in -> bounce to login
  useEffect(() => {
    if (user === null) {
      sessionStorage.setItem("redirect-to", "/account");
      router.replace("/login");
    }
  }, [user, router]);

  // Fetch profile when we have a user
useEffect(() => {
  if (!userId) return;

  let mounted = true;
  const run = async () => {
    setLoadingProfile(true);
    setSaveErr(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, created_at")
        .eq("id", userId)
        .single(); // returns one row or error

      if (error) throw error;
      if (!mounted) return;

      // Cast the row once, locally — simplest + stable for TS
      const row = (data ?? null) as Profile | null;

      const p: Profile = {
        username: row?.username ?? null,
        avatar_url: row?.avatar_url ?? null,
        created_at: row?.created_at ?? null,
      };
      setProfile(p);
      setUsername(p.username ?? "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load profile.";
      setSaveErr(msg ?? "Failed to load profile.");
    } finally {
      if (mounted) setLoadingProfile(false);
    }
  };

  void run();
  return () => {
    mounted = false;
  };
}, [userId]);


  const createdWhen = useMemo(() => {
    if (!profile?.created_at) return null;
    try {
      const d = new Date(profile.created_at);
      return isNaN(d.getTime()) ? null : d.toLocaleString();
    } catch {
      return null;
    }
  }, [profile?.created_at]);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const clean = username.trim();
    if (clean.length === 0) {
      setSaveErr("Username cannot be empty.");
      return;
    }

    setSaveLoading(true);
    setSaveErr(null);
    setSaveMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: clean })
        .eq("id", userId);

      if (error) {
        const msg = error.message?.toLowerCase().includes("unique")
          ? "That username is already taken."
          : error.message ?? "Could not update username.";
        setSaveErr(msg);
        return;
      }

      setProfile((p) =>
        p ? { ...p, username: clean } : { username: clean, avatar_url: null, created_at: null },
      );
      setSaveMsg("Username updated.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not update username.";
      setSaveErr(msg ?? "Could not update username.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);

    if (pw1.length < 6) {
      setPwErr("Password must be at least 6 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setPwErr("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPwMsg("Password updated.");
      setPw1("");
      setPw2("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not update password.";
      setPwErr(msg ?? "Could not update password.");
    } finally {
      setPwLoading(false);
    }
  };

  // While we decide/redirect, or while loading profile
  if (user === null || (userId && loadingProfile && !profile)) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-blue-950">
        <p className="text-slate-300">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-blue-950 text-slate-100 px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl bg-blue-900/50 border border-blue-800 shadow-xl p-6 backdrop-blur">
          <h1 className="text-3xl font-extrabold text-center mb-2">Your Account</h1>
          <p className="text-slate-300 text-center mb-6">
            Manage your profile and security settings.
          </p>

          {/* Basic info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-800 bg-blue-900/40 p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <p className="mt-1 text-lg break-all">{displayEmail ?? "—"}</p>
              {createdWhen && (
                <p className="mt-2 text-xs text-slate-400">Joined: {createdWhen}</p>
              )}
            </div>

            <form
              onSubmit={handleSaveUsername}
              className="rounded-lg border border-blue-800 bg-blue-900/40 p-4"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <UserIcon className="h-4 w-4" />
                <span className="text-sm">Username</span>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <input
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                />
              </div>
              {saveErr && <p className="mt-2 text-sm text-red-300">{saveErr}</p>}
              {saveMsg && <p className="mt-2 text-sm text-emerald-300">{saveMsg}</p>}
              <div className="mt-3">
                <Button
                  type="submit"
                  disabled={saveLoading}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saveLoading ? "Saving…" : "Save username"}
                </Button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="mt-6 rounded-lg border border-blue-800 bg-blue-900/40 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Change password</span>
            </div>

            <form onSubmit={handleChangePassword} className="mt-2 grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <input
                  type="password"
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <input
                  type="password"
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              {pwErr && <p className="md:col-span-2 text-sm text-red-300">{pwErr}</p>}
              {pwMsg && <p className="md:col-span-2 text-sm text-emerald-300">{pwMsg}</p>}

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {pwLoading ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </div>

          {/* Advanced (optional): show user id */}
          <p className="mt-6 text-xs text-slate-400 break-all">
            User ID: {userId ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
