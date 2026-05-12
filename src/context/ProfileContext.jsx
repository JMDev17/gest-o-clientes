import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { AuthContext } from './AuthContext.jsx'

// eslint-disable-next-line react-refresh/only-export-components
export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useContext(AuthContext)

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  // Track which user ID we've already loaded a profile for. If the same user
  // triggers fetchProfile again (e.g. workspace switch), we skip the loading
  // spinner so ProfileGate never unmounts the active page.
  const loadedForUser = useRef(null)

  const fetchProfile = useCallback(async (uid) => {
    if (loadedForUser.current !== uid) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
      if (error) throw error
      setProfile(data)
      loadedForUser.current = uid
    } catch {
      setProfile(null)
      loadedForUser.current = null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      loadedForUser.current = null
      return
    }
    fetchProfile(user.id)
  }, [user, fetchProfile])

  async function createProfile(fields) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...fields, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  async function updateProfile(fields) {
    const { data, error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, createProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
