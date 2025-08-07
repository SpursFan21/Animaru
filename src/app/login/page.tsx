//Animaru\src\app\login\page.tsx

"use client"

import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { setUser } from "../../redux/authSlice"
import { supabase } from "../../utils/supabaseClient"
import { useState } from "react"
import { Button } from "../../components/ui/button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const dispatch = useDispatch()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Login failed: " + error.message)
    } else {
      dispatch(setUser(data.user))
      router.push("/")
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Login</h1>

      <input
        className="block mb-2 w-full p-2 rounded bg-slate-800 text-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        type="password"
        className="block mb-4 w-full p-2 rounded bg-slate-800 text-white"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      {/* ShadCN button*/}
      <Button onClick={handleLogin} className="w-full">
        Login
      </Button>
    </div>
  )
}
