//Animaru\src\app\register\page.tsx

"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { setUser } from "../../redux/authSlice"
import { supabase } from "../../utils/supabaseClient"
import { Button } from "../../components/ui/button"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()
  const dispatch = useDispatch()

  const handleRegister = async () => {
    if (email !== confirmEmail) {
      alert("Emails do not match.")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      alert("Registration failed: " + error.message)
    } else if (data.user) {
      dispatch(setUser(data.user))
      router.push("/")
    } else {
      alert("Registration succeeded but user data is missing.")
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Register</h1>

      <input
        className="block mb-2 w-full p-2 rounded bg-slate-800 text-white"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      <input
        className="block mb-2 w-full p-2 rounded bg-slate-800 text-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        className="block mb-2 w-full p-2 rounded bg-slate-800 text-white"
        value={confirmEmail}
        onChange={(e) => setConfirmEmail(e.target.value)}
        placeholder="Confirm Email"
      />

      <input
        type="password"
        className="block mb-2 w-full p-2 rounded bg-slate-800 text-white"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <input
        type="password"
        className="block mb-4 w-full p-2 rounded bg-slate-800 text-white"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
      />

      <Button onClick={handleRegister} className="w-full">
        Register
      </Button>
    </div>
  )
}
