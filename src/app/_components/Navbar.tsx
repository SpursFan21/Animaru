//Animaru\src\app\_components\Navbar.tsx

"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"

export function Navbar() {
  const user = useAuthStore((s) => s.user)

  return (
    <nav className="flex justify-between p-4 bg-gray-900 text-white">
      <Link href="/">Animaru</Link>

      <div className="space-x-4">
        {user ? (
          <>
            <span>Welcome</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                location.reload() // quick refresh for logout effect
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
