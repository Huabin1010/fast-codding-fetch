"use client"

import { signIn, signOut, useSession } from "next-auth/react"

export default function SignInButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("credentials")}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
    >
      Sign In (admin / 123456qq)
    </button>
  )
}
