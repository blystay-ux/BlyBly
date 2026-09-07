import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isInsider, setIsInsider] = useState(false)
  const [corporateAccount, setCorporateAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    if (!u) { setProfile(null); return null }
    const { data } = await supabase
      .from('profiles')
      .select('id, role, full_name, status')
      .eq('id', u.id)
      .single()
    setProfile(data ?? null)
    return data ?? null
  }

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

  async function loadCorporateAccount(u, profile) {
    if (!u || profile?.role !== 'corporate') { setCorporateAccount(null); return }
    const { data } = await supabase
      .from('corporate_accounts')
      .select('id, company_name, contact_name, commission_pct, is_active')
      .eq('user_id', u.id)
      .eq('is_active', true)
      .maybeSingle()
    setCorporateAccount(data ?? null)
  }

  async function loadAll(u) {
    if (!u) {
      setProfile(null)
      setIsInsider(false)
      setCorporateAccount(null)
      return
    }
    const [profileData] = await Promise.all([
      loadProfile(u),
      loadInsiderStatus(u),
    ])
    await loadCorporateAccount(u, profileData)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      await loadAll(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        await loadAll(u)
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
        corporateAccount,
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
