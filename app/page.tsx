"use client"

import { useSession, signIn } from "next-auth/react"

export default function Dashboard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <p>Memuat session...</p>
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <p>Silakan login</p>
        <button onClick={() => signIn("google")}>
          Login dengan Google
        </button>
      </div>
    )
  }

  // 🔥 PASTI LOGIN
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Halo, {session?.user?.email}</p>
    </div>
  )
}
