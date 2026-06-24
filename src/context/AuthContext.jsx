import { createContext, useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabaseClient.js'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update user if the identity actually changed.
      // TOKEN_REFRESHED fires with a new session object but the same user.id —
      // returning the previous reference avoids cascading re-fetches and keeps
      // open modals/forms alive when the user returns to this tab.
      setUser(prev => {
        const next = session?.user ?? null
        if (prev?.id === next?.id) return prev
        return next
      })
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email, password) {
    if (!isConfigured) {
      console.error('[Supabase] Client não inicializado — verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // Retorna { needsConfirmation: boolean }
  // needsConfirmation = true  → Supabase exige verificação de e-mail
  // needsConfirmation = false → sessão criada imediatamente (auto-confirm ativo)
  async function signUp(email, password) {
    if (!isConfigured) {
      console.error('[Supabase] Client não inicializado — verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local')
      return { needsConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error

    // Quando a confirmação de e-mail está ativa e o e-mail já existe,
    // o Supabase retorna sucesso com identities vazio (evita enumeração de e-mails).
    if (data.user?.identities?.length === 0) {
      throw { message: 'User already registered' }
    }

    return { needsConfirmation: !data.session }
  }

  async function signOut() {
    if (!isConfigured) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
