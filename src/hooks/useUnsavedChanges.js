import { useEffect, useCallback } from 'react'

const MODAL_MSG = 'Você tem alterações não salvas. Ao fechar, os dados preenchidos serão perdidos. Deseja continuar?'

export function useUnsavedChanges(isDirty) {
  // Block browser refresh / tab close (F5, Ctrl+W, etc.)
  useEffect(() => {
    if (!isDirty) return
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Guard for modal / overlay close
  const guardClose = useCallback((onClose) => {
    if (!isDirty) { onClose(); return }
    if (window.confirm(MODAL_MSG)) onClose()
  }, [isDirty])

  return { guardClose }
}
