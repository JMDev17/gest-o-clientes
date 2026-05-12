import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

export function useContentTracking() {
  const { user } = useAuth()
  const [plans, setPlans]           = useState([])
  const [logs, setLogs]             = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingLogs, setLoadingLogs]   = useState(false)
  const [error, setError]           = useState(null)

  // Track the currently displayed week range so mutations can update state correctly
  const weekRangeRef = useRef(null)

  const fetchPlans = useCallback(async () => {
    if (!user) { setLoadingPlans(false); return }
    setLoadingPlans(true)
    const { data, error: err } = await supabase
      .from('content_plans')
      .select('*, client:clients(id, name, company_name)')
      .order('created_at', { ascending: true })
    if (err) setError('Não foi possível carregar os planos de conteúdo.')
    else setPlans(data ?? [])
    setLoadingPlans(false)
  }, [user])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  async function fetchLogs(startDate, endDate) {
    if (!user) return
    weekRangeRef.current = { start: startDate, end: endDate }
    setLoadingLogs(true)
    const { data, error: err } = await supabase
      .from('content_logs')
      .select('*, client:clients(id, name)')
      .gte('performed_at', startDate)
      .lte('performed_at', endDate)
      .order('performed_at', { ascending: true })
    if (err) setError('Não foi possível carregar os registros de conteúdo.')
    else setLogs(data ?? [])
    setLoadingLogs(false)
  }

  // Upsert plan for a client (insert if new, update if existing)
  async function savePlan(clientId, fields) {
    const existing = plans.find(p => p.client_id === clientId)
    if (existing) {
      const { data, error: err } = await supabase
        .from('content_plans')
        .update(fields)
        .eq('id', existing.id)
        .select('*, client:clients(id, name, company_name)')
        .single()
      if (err) { console.error('[useContentTracking] savePlan update:', err); throw err }
      setPlans(prev => prev.map(p => (p.id === existing.id ? data : p)))
    } else {
      const { data, error: err } = await supabase
        .from('content_plans')
        .insert({ ...fields, client_id: clientId, user_id: user.id })
        .select('*, client:clients(id, name, company_name)')
        .single()
      if (err) { console.error('[useContentTracking] savePlan insert:', err); throw err }
      setPlans(prev => [...prev, data])
    }
  }

  async function deletePlan(id) {
    const { error: err } = await supabase.from('content_plans').delete().eq('id', id)
    if (err) throw err
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  async function createLog(fields) {
    const { data, error: err } = await supabase
      .from('content_logs')
      .insert({ ...fields, user_id: user.id })
      .select('*, client:clients(id, name)')
      .single()
    if (err) { console.error('[useContentTracking] createLog:', err); throw err }
    const range = weekRangeRef.current
    if (range && data.performed_at >= range.start && data.performed_at <= range.end) {
      setLogs(prev => [...prev, data].sort((a, b) => a.performed_at.localeCompare(b.performed_at)))
    }
    return data
  }

  async function updateLog(id, fields) {
    const { data, error: err } = await supabase
      .from('content_logs')
      .update(fields)
      .eq('id', id)
      .select('*, client:clients(id, name)')
      .single()
    if (err) { console.error('[useContentTracking] updateLog:', err); throw err }
    const range = weekRangeRef.current
    setLogs(prev => {
      const without = prev.filter(l => l.id !== id)
      if (range && data.performed_at >= range.start && data.performed_at <= range.end) {
        return [...without, data].sort((a, b) => a.performed_at.localeCompare(b.performed_at))
      }
      return without
    })
    return data
  }

  async function createMultipleLogs({ client_id, date, photos, posts, notes }) {
    const rows = []
    if (photos > 0) rows.push({ client_id, content_type: 'photo', quantity: photos, performed_at: date, notes: notes || null, user_id: user.id })
    if (posts  > 0) rows.push({ client_id, content_type: 'post',  quantity: posts,  performed_at: date, notes: notes || null, user_id: user.id })
    if (rows.length === 0) return []
    const { data, error: err } = await supabase
      .from('content_logs')
      .insert(rows)
      .select('*, client:clients(id, name)')
    if (err) { console.error('[useContentTracking] createMultipleLogs:', err); throw err }
    const range = weekRangeRef.current
    if (range) {
      const inRange = (data ?? []).filter(l => l.performed_at >= range.start && l.performed_at <= range.end)
      if (inRange.length > 0) {
        setLogs(prev => [...prev, ...inRange].sort((a, b) => a.performed_at.localeCompare(b.performed_at)))
      }
    }
    return data ?? []
  }

  async function deleteLog(id) {
    const { error: err } = await supabase.from('content_logs').delete().eq('id', id)
    if (err) { console.error('[useContentTracking] deleteLog:', err); throw err }
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return {
    plans, logs, loadingPlans, loadingLogs, error,
    fetchLogs, fetchPlans,
    savePlan, deletePlan,
    createLog, createMultipleLogs, updateLog, deleteLog,
  }
}
