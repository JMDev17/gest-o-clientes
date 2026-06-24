import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile.js'
import { useWorkspace } from '../hooks/useWorkspace.js'

export default function ProfileGate() {
  const { profile, loading } = useProfile()
  const { setWorkspaceType } = useWorkspace()

  useEffect(() => {
    if (profile?.business_type) {
      setWorkspaceType(profile.business_type)
    }
  }, [profile, setWorkspaceType])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/setup-workspace" replace />
  }

  return <Outlet />
}
