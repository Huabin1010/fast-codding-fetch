'use client'

import { useSession } from "next-auth/react"
import LoginForm from "@/components/auth/LoginForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
            <p className="mt-2 text-gray-600">Sign in to access the dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return <Dashboard />
}
