'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          router.push('/dashboard')
          return
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        router.push('/dashboard')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <h1 className="text-3xl font-bold text-center">SmartBooking App</h1>

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
      </div>
    </div>
  )
}
