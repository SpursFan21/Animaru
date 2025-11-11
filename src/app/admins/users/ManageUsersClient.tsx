//Animaru\src\app\admins\users\ManageUsersClient.tsx

"use client";

import { useMemo, useState, useActionState } from "react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";
import type { AdminUserRow } from "./actions";
import {
  getProfileAction,
  resetPasswordAction,
  toggleBanUserAction,
  updateProfileAction,
} from "./actions";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 font-semibold"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function ManageUsersClient({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [profile, setProfile] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      [
        u.email ?? "",
        u.profile?.username ?? "",
        u.id,
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, users]);

  async function onViewProfile(id: string) {
    const res = await getProfileAction(id);
    if (res.ok) setProfile(res.profile);
    else toast.error(res.error ?? "Failed to load profile");
  }

  async function onToggleBan(id: string, banned: boolean) {
    await toggleBanUserAction(id, banned);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned } : u))
    );
    toast.success(banned ? "User banned" : "User unbanned");
  }

  async function onResetPassword(id: string) {
    const res = await resetPasswordAction(id);
    if (!res.ok || !res.link) {
      toast.error(res.error ?? "Could not generate reset link");
      return;
    }
    await navigator.clipboard.writeText(res.link);
    toast.success("Recovery link copied to clipboard");
  }

  return (
    <div className="space-y-5">
      {/* panel */}
      <div className="rounded-2xl border border-blue-900/60 bg-slate-900/40 p-4">
        {/* search */}
        <div className="mb-4 flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, username or id…"
            className="w-full md:w-[420px] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
          />
          <div className="text-sm text-slate-400">{filtered.length} users</div>
        </div>

        {/* list */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4 flex items-center gap-4"
            >
              {/* avatar */}
              <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    u.profile?.avatar_url ||
                    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                      u.profile?.username || u.email || u.id
                    )}`
                  }
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* info */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">
                  {u.profile?.username ?? "(no username)"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {u.email ?? "— email hidden —"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                  {u.banned && <span className="ml-2 text-rose-400">• BANNED</span>}
                </div>
              </div>

              {/* actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onViewProfile(u.id)}
                  className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => onResetPassword(u.id)}
                  className="rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-sm"
                >
                  Reset PW
                </button>
                <button
                  onClick={() => onToggleBan(u.id, !u.banned)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    u.banned
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {u.banned ? "Unban" : "Ban"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-sm text-slate-400">No users match your search.</div>
        )}
      </div>

      {/* Profile modal */}
      {profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfile(null)}
        />
      )}
    </div>
  );
}

/* ---------------- Profile Modal ---------------- */

function ProfileModal({
  profile,
  onClose,
}: {
  profile: { id: string; username: string | null; avatar_url: string | null };
  onClose: () => void;
}) {
  const [result, formAction] = useActionState(updateProfileAction, null as any);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[min(720px,92vw)] rounded-2xl border border-blue-900/60 bg-blue-950/80 backdrop-blur-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">User Profile</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-slate-300 hover:bg-slate-800">
            Close
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={profile.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input
                name="username"
                defaultValue={profile.username ?? ""}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Avatar URL</label>
              <input
                name="avatar_url"
                defaultValue={profile.avatar_url ?? ""}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <SubmitBtn label="Save Changes" />
            {result?.error && (
              <div className="text-sm text-rose-400">{result.error}</div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


