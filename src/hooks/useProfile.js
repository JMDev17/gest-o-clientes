import { useContext } from 'react'
import { ProfileContext } from '../context/ProfileContext.jsx'

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile deve ser usado dentro de ProfileProvider')
  return ctx
}
