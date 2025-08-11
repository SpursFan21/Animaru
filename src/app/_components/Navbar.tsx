//Animaru\src\app\_components\Navbar.tsx

"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { clearUser } from "../../redux/authSlice";
import { supabase } from "../../utils/supabaseClient";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function Navbar() {
  const user = useSelector<RootState, User | null>((s) => s.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      dispatch(clearUser());
      // Keep it SPA-smooth:
      router.refresh(); // re-render layouts using client state
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Subbed Anime", href: "/subbed" },
    { name: "Dubbed Anime", href: "/dubbed" },
    { name: "Movies", href: "/movies" },
    { name: "Most Popular", href: "/popular" },
  ];

  const displayName =
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <nav className="bg-blue-950 text-slate-200 border-b border-blue-900 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300">
          Animaru
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-sky-300 transition">
              {link.name}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/account"
                className="px-4 py-2 rounded-md border border-blue-800 hover:border-sky-500 text-slate-200 hover:text-white"
                title="Account"
              >
                {displayName}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 bg-blue-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md"
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-sky-500 text-white rounded-md"
              >
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
          <div className="px-4 py-3 flex flex-col gap-2">
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
                  href="/account"
                  className="w-full px-4 py-2 rounded-md border border-blue-800 text-center hover:border-sky-500"
                  onClick={() => setMenuOpen(false)}
                >
                  {displayName}
                </Link>
                <button
                  onClick={handleLogout}
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
