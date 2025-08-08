//Animaru\src\app\register\page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/authSlice";
import { supabase } from "../../utils/supabaseClient";
import { Button } from "../../components/ui/button";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (email !== confirmEmail) return setErr("Emails do not match.");
    if (password !== confirmPassword) return setErr("Passwords do not match.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    if (data?.user) {
      dispatch(setUser(data.user));
      router.push("/");
    } else {
      setErr("Registration succeeded but user data is missing.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-blue-950 text-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-blue-900/50 border border-blue-800 shadow-xl p-6 backdrop-blur">
          <h1 className="text-3xl font-extrabold text-center mb-2">Create account</h1>
          <p className="text-slate-300 text-center mb-6">
            Join Animaru and start tracking & watching your favorites.
          </p>

          {err && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username */}
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Username</span>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <User className="h-4 w-4 text-slate-400" />
                <input
                  required
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="otaku_senpai"
                />
              </div>
            </label>

            {/* Email */}
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Email</span>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            {/* Confirm Email */}
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Confirm Email</span>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Password</span>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="p-1 text-slate-300 hover:text-white"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {/* Confirm Password */}
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Confirm Password</span>
              <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type={showPw2 ? "text" : "password"}
                  required
                  className="w-full bg-transparent py-2.5 outline-none placeholder:text-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                  className="p-1 text-slate-300 hover:text-white"
                  onClick={() => setShowPw2((s) => !s)}
                >
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <a className="text-sky-400 hover:underline" href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
