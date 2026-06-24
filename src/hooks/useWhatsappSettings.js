import { useState } from 'react'
import { DEFAULT_TEMPLATE } from '../utils/whatsapp.js'

const STORAGE_KEY = 'gc_whatsapp_settings'

const DEFAULTS = {
  companyName:     '',
  signature:       '',
  messageTemplate: DEFAULT_TEMPLATE,
}

export function useWhatsappSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS }
    } catch {
      return { ...DEFAULTS }
    }
  })

  function saveSettings(next) {
    const merged = { ...settings, ...next }
    setSettings(merged)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch { /* private mode */ }
  }

  return { settings, saveSettings }
}
