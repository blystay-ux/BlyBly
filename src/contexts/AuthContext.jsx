import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isInsider, setIsInsider] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    if (!u) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, role, full_name, status')
      .eq('id', u.id)
      .single()
    setProfile(data ?? null)
  }

  // Computed once here (not re-queried per page) so every page can check
  // useAuth().isInsider directly for Bly Insiders pricing/features. Checks
  // BOTH status === 'active' AND that expires_at hasn't already passed --
  // there's no automatic cron job that flips expired memberships back to
  // 'expired', so this guards against a stale 'active' row past its date.
  async function loadInsiderStatus(u) {
    if (!u) { setIsInsider(false); return }
    const { data } = await supabase
      .from('industry_memberships')
      .select('status, expires_at')
      .eq('user_id', u.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const stillValid = !!data && (!data.expires_at || new Date(data.expires_at) > new Date())
    setIsInsider(stillValid)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      await Promise.all([loadProfile(u), loadInsiderStatus(u)])
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        await Promise.all([loadProfile(u), loadInsiderStatus(u)])
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        isInsider,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
