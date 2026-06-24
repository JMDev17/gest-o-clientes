import { createContext, useState } from 'react'
import { configs, WORKSPACE_TYPES } from '../config/workspace.js'

const STORAGE_KEY = 'gc_workspace_type'

function getInitialType() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (WORKSPACE_TYPES.includes(stored)) return stored
  } catch { /* modo privado sem localStorage */ }
  const env = import.meta.env.VITE_WORKSPACE_TYPE
  return WORKSPACE_TYPES.includes(env) ? env : 'marketing'
}

// eslint-disable-next-line react-refresh/only-export-components
export const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspaceType, setType] = useState(getInitialType)

  function setWorkspaceType(type) {
    if (!WORKSPACE_TYPES.includes(type)) return
    try { localStorage.setItem(STORAGE_KEY, type) } catch { /* ignorar */ }
    setType(type)
  }

  return (
    <WorkspaceContext.Provider value={{
      workspace:     configs[workspaceType],
      workspaceType,
      setWorkspaceType,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}
