//Animaru\src\app\_components\Navbar.tsx

"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { clearUser } from "../../redux/authSlice";
import { supabase } from "../../utils/supabaseClient";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type UserMeta = { username?: string };

// ---------- Pro Search ----------
type AnimeRow = {
  id: string;
  slug: string;
  title: string;
  cover_path: string | null;
};


function useOutsideClose<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onClose: () => void
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (ref.current && !ref.current.contains(t)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}


function ProSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement | null>(null);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [rows, setRows] = useState<AnimeRow[]>([]);

  useOutsideClose(boxRef, () => setOpen(false));

  // Debounced search
  useEffect(() => {
    const term = q.trim();
    setIdx(-1);
    if (term.length < 2) {
      setRows([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const { data, error } = await supabase
            .from("anime")
            .select("id, slug, title, cover_path")
            .ilike("title", `%${term}%`)
            .order("updated_at", { ascending: false })
            .limit(8)
            .returns<AnimeRow[]>();
          if (cancelled) return;
          if (error) throw error;
          setRows(data ?? []);
          setOpen(true);
        } catch {
          setRows([]);
          setOpen(false);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const onEnter = () => {
    if (idx >= 0 && idx < rows.length) {
      const pick = rows[idx];
      if (pick) {
        router.push(`/anime/${pick.slug}`);
        setOpen(false);
      }
      return;
    }

    if (q.trim().length >= 2) {
      // Fallback: first result (if any)
      const first = rows[0];
      if (first) router.push(`/anime/${first.slug}`);
      setOpen(false);
    }
  };


  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && e.key !== "Escape") setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setIdx(rows.length ? 0 : -1);
    } else if (e.key === "End") {
      e.preventDefault();
      setIdx(rows.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/60 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="Search anime…"
          className="bg-transparent outline-none placeholder:text-slate-400 w-56 lg:w-72"
          aria-label="Search anime"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-md border border-blue-800 bg-blue-900/95 backdrop-blur shadow-2xl z-50 overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-sm text-slate-300">Searching…</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-300">No matches.</div>
          ) : (
            <ul>
              {rows.map((r, i) => (
                <li key={r.id}>
                  <button
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-800",
                      i === idx ? "bg-blue-800/60" : "",
                    ].join(" ")}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                      setRows([]);
                      router.push(`/anime/${r.slug}`);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        r.cover_path
                          ? supabase.storage.from("covers").getPublicUrl(r.cover_path).data.publicUrl
                          : "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                      }
                      alt=""
                      className="h-9 w-6 object-cover rounded-sm border border-blue-800"
                    />
                    <span className="text-sm">{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
// ---------- /Pro Search ----------

export function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const user = useSelector<RootState, User | null>((s) => s.auth.user);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      dispatch(clearUser());
      router.refresh();
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "Subbed Anime", href: "/subbed" },
    { name: "Dubbed Anime", href: "/dubbed" },
    { name: "Movies", href: "/movies" },
    { name: "Most Popular", href: "/popular" },
  ];

  const meta = (user?.user_metadata ?? {}) as unknown as UserMeta;
  const usernameFromMeta = typeof meta.username === "string" ? meta.username : undefined;

  const displayName =
    usernameFromMeta ?? (user?.email ? user.email.split("@")[0] : undefined) ?? "Account";

  return (
    <nav className="bg-blue-950 text-slate-200 border-b border-blue-900 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300">
          Animaru
        </Link>

        {/* Desktop: links + search + auth */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-sky-300 transition">
              {link.name}
            </Link>
          ))}

          {/* Pro Search */}
          <ProSearch />

          {user ? (
            <>
              <Link
                href="/watchlists"
                className="px-4 py-2 rounded-md border border-blue-800 hover:border-sky-500 text-slate-200 hover:text-white"
                title="Watchlist"
              >
                Watchlists
              </Link>

              <Link
                href="/continue-watching"
                className="px-4 py-2 rounded-md border border-blue-800 hover:border-sky-500 text-slate-200 hover:text-white"
                title="Continue Watching"
              >
                Resume
              </Link>

              <Link
                href="/account"
                className="px-4 py-2 rounded-md border border-blue-800 hover:border-sky-500 text-slate-200 hover:text-white"
                title="Account"
              >
                {displayName}
              </Link>

              <button
                onClick={() => { void handleLogout(); }}
                disabled={loggingOut}
                className="px-4 py-2 bg-blue-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md"
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-sky-400 focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-950 border-t border-blue-900">
          <div className="px-4 py-3 flex flex-col gap-3">
            {/* Mobile Pro Search */}
            <ProSearch className="w-full" />

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="py-2 hover:text-sky-300"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/watchlists"
                  className="w-full px-4 py-2 rounded-md border border-blue-800 text-center hover:border-sky-500"
                  onClick={() => setMenuOpen(false)}
                >
                  Watchlists
                </Link>
                <Link
                  href="/account"
                  className="w-full px-4 py-2 rounded-md border border-blue-800 text-center hover:border-sky-500"
                  onClick={() => setMenuOpen(false)}
                >
                  {displayName}
                </Link>
                <button
                  onClick={() => { void handleLogout(); }}
                  disabled={loggingOut}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-md"
                >
                  {loggingOut ? "Logging out…" : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
