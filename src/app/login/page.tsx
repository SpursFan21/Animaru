//

"use client"

import { supabase } from "@/utils/supabaseClient"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert("Login failed: " + error.message)
    } else {
      setUser(data.user)
      router.push("/")
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Login</h1>
      <input className="block mb-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="block mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  )
}
