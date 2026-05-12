import { useContext } from 'react'
import { WorkspaceContext } from '../context/WorkspaceContext.jsx'

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace deve ser usado dentro de WorkspaceProvider')
  return ctx
}
