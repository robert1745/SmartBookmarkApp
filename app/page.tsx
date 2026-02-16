'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User, Session } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)

        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8 rounded-lg border p-8">
        <h1 className="text-3xl font-bold text-center">SmartBooking App</h1>
        
        {user ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 border border-green-200 p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Authenticated</h2>
              <div className="space-y-2 text-sm text-gray-900">
                <p><strong className="text-black">Email:</strong> {user.email}</p>
                <p><strong className="text-black">User ID:</strong> {user.id}</p>
                <p><strong className="text-black">Provider:</strong> {user.app_metadata?.provider || 'N/A'}</p>
                <p><strong className="text-black">Created:</strong> {new Date(user.created_at || '').toLocaleString()}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">⚠️ Not Authenticated</h2>
              <p className="text-sm text-yellow-700">Please sign in to continue.</p>
            </div>
            
            <Link
              href="/login"
              className="block w-full text-center rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}


      </div>
    </div>
  )
}
