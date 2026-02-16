'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [fetchingBookmarks, setFetchingBookmarks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookmarks = async (userId: string) => {
    if (!userId) return

    setFetchingBookmarks(true)
    setError(null)
    
    const { data, error: fetchError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('[fetchBookmarks] Error:', fetchError)
      setError('Failed to load bookmarks: ' + fetchError.message)
    } else if (data) {
      console.log('[fetchBookmarks] Loaded', data.length, 'bookmarks')
      setBookmarks(data)
    }
    
    setFetchingBookmarks(false)
  }

  // First effect: Check auth and fetch initial bookmarks
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      console.log('[Auth] Logged in as:', session.user.email)
      setUser(session.user)
      await fetchBookmarks(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Second effect: Set up realtime subscription only when user is available
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.user_id === user.id) {
            setBookmarks((current) => {
              if (current.some(b => b.id === payload.new.id)) return current
              console.log('[Realtime] Bookmark added')
              return [payload.new, ...current]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setBookmarks((current) => {
            const filtered = current.filter(b => b.id !== payload.old.id)
            console.log('[Realtime] Bookmark deleted')
            return filtered
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime] ❌ Connection failed:', status)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  // Third effect: Listen for auth state changes (logout from other tabs)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to add bookmarks')
      return
    }
    
    if (!title || !url) return
    
    setSubmitting(true)
    setError(null)
    
    const { data, error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        title,
        url,
      })
      .select()
    
    if (insertError) {
      console.error('[Insert] Error:', insertError)
      setError('Failed to add bookmark: ' + insertError.message)
    } else {
      setTitle('')
      setUrl('')
      // Fallback: if realtime doesn't update in 500ms, add manually
      setTimeout(() => {
        setBookmarks((current) => {
          if (data && data[0] && !current.some(b => b.id === data[0].id)) {
            return [data[0], ...current]
          }
          return current
        })
      }, 500)
    }
    
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      setError('You must be logged in to delete bookmarks')
      return
    }

    if (deleting) return
    
    setDeleting(id)
    setError(null)
    
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('[Delete] Error:', deleteError)
      setError('Failed to delete bookmark: ' + deleteError.message)
    } else {
      // Fallback: if realtime doesn't update in 500ms, remove manually
      setTimeout(() => {
        setBookmarks((current) => {
          if (current.some(b => b.id === id)) {
            console.log('[handleDelete] Fallback: Removing bookmark from state')
            return current.filter(b => b.id !== id)
          }
          return current
        })
      }, 500)
    }
    
    setDeleting(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SmartBooking</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-sm font-medium mb-2 text-white opacity-90">Welcome</h3>
            <p className="text-lg font-semibold text-white truncate">{user?.email}</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-sm font-medium mb-2 text-white opacity-90">User ID</h3>
            <p className="text-xs font-mono text-white break-all">{user?.id}</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-sm font-medium mb-2 text-white opacity-90">Provider</h3>
            <p className="text-lg font-semibold text-white capitalize">{user?.app_metadata?.provider || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Add Bookmark</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                placeholder="My favorite website"
              />
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-900 mb-2">
                URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                placeholder="https://example.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Adding...' : 'Add Bookmark'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">My Bookmarks</h2>
          {fetchingBookmarks ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading bookmarks...</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No bookmarks yet. Add your first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="rounded-lg bg-gray-900 p-5 flex justify-between items-start hover:bg-gray-800 transition-all shadow-sm">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-white mb-1 truncate">{bookmark.title}</h3>
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all inline-block"
                    >
                      {bookmark.url}
                    </a>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    disabled={deleting === bookmark.id}
                    className="ml-4 flex-shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {deleting === bookmark.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}