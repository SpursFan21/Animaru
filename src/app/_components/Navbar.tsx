//Animaru\src\app\_components\Navbar.tsx

"use client"

import Link from "next/link"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "../../redux/store"
import { clearUser } from "../../redux/authSlice"
import { supabase } from "../../utils/supabaseClient"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const user = useSelector<RootState, User | null>((state) => state.auth.user)
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(clearUser())
    location.reload()
  }

  return (
    <nav className="bg-ocean border-b border-blue-900 text-slate-200 px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300">
          Animaru
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-slate-300">Welcome</span>
              <button
                onClick={handleLogout}
                className="btn bg-blue-600 hover:bg-sky-500 text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn bg-blue-600 hover:bg-sky-500 text-white">
                Login
              </Link>
              <Link href="/register" className="btn bg-blue-600 hover:bg-sky-500 text-white">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-sky-400 focus:outline-none"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden flex flex-col gap-2 mt-3 px-4 pb-4">
          {user ? (
            <>
              <span className="text-slate-300">Welcome</span>
              <button
                onClick={handleLogout}
                className="btn bg-blue-600 hover:bg-sky-500 text-white w-full"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn bg-blue-600 hover:bg-sky-500 text-white w-full text-center"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn bg-blue-600 hover:bg-sky-500 text-white w-full text-center"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
