import { useState, useEffect, useCallback, useRef } from 'react'

export function useFormDraft(draftKey, data, isDirty) {
  // Load any existing draft exactly once on mount
  const [initialDraft] = useState(() => {
    if (!draftKey) return null
    try {
      const raw = sessionStorage.getItem(draftKey)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const [lastSaved, setLastSaved] = useState(null)

  // Debounced auto-save — only when dirty
  const dataStr = JSON.stringify(data)
  useEffect(() => {
    if (!draftKey || !isDirty) return
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ data, savedAt: new Date().toISOString() }))
        setLastSaved(new Date())
      } catch { /* storage unavailable */ }
    }, 600)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, dataStr, isDirty])

  const clearDraft = useCallback(() => {
    if (!draftKey) return
    try { sessionStorage.removeItem(draftKey) } catch { /* */ }
    setLastSaved(null)
  }, [draftKey])

  return {
    hasDraft:     Boolean(initialDraft),
    draftData:    initialDraft?.data    ?? null,
    draftSavedAt: initialDraft?.savedAt ?? null,
    lastSaved,
    clearDraft,
  }
}
