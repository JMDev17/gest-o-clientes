import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

export function useWhatsappLogs(clientId = null) {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    let query = supabase
      .from('whatsapp_logs')
      .select('*, payment:payments(amount, due_date, notes)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (clientId) query = query.eq('client_id', clientId)
    const { data } = await query
    setLogs(data ?? [])
    setLoading(false)
  }, [user, clientId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function createLog({ client_id, payment_id, phone, message }) {
    if (!user) return
    const { data, error } = await supabase
      .from('whatsapp_logs')
      .insert({ user_id: user.id, client_id: client_id ?? null, payment_id: payment_id ?? null, phone, message })
      .select('*, payment:payments(amount, due_date, notes)')
      .single()
    if (error) throw error
    setLogs(prev => [data, ...prev])
    return data
  }

  return { logs, loading, createLog, refetch: fetchLogs }
}
