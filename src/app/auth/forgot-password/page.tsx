//Animaru\src\app\auth\forgot-password\page.tsx

"use client";

import { useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import { Button } from "../../../components/ui/button";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setOk("If an account exists for that email, a reset link has been sent.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send reset link.";
      setErr(msg ?? "Could not send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-blue-950 text-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-blue-900/50 border border-blue-800 shadow-xl p-6 backdrop-blur">
          <h1 className="text-3xl font-extrabold text-center mb-2">Reset your password</h1>
          <p className="text-slate-300 text-center mb-6">We’ll email you a secure reset link.</p>

          {err && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}
          {ok && <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{ok}</div>}

          <form onSubmit={handleSend} className="space-y-4">
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
                  autoComplete="email"
                />
              </div>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
