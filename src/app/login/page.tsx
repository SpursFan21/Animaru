//Animaru\src\app\login\page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/authSlice";
import { supabase } from "../../utils/supabaseClient";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    if (data?.user) {
      dispatch(setUser(data.user));
      router.push("/");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-blue-950 text-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-blue-900/50 border border-blue-800 shadow-xl p-6 backdrop-blur">
          <h1 className="text-3xl font-extrabold text-center mb-2">Login</h1>
          <p className="text-slate-300 text-center mb-6">
            Welcome back. Sign in to continue watching.
          </p>

          {err && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-300">
            New here?{" "}
            <a className="text-sky-400 hover:underline" href="/register">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
