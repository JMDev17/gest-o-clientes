import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

/**
 * Read-only hook for financial reports.
 * Loads ALL payments with client + contract joins (contract is optional/graceful).
 * Different from usePayments which is CRUD-focused.
 */
export function useFinancialReports() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    // Try with contract join first; fall back without if column doesn't exist
    let query = supabase
      .from('payments')
      .select('*, client:clients(id, name)')
      .order('due_date', { ascending: false, nullsFirst: false })

    const { data, error: err } = await query

    if (err) {
      setError('Não foi possível carregar os dados financeiros.')
    } else {
      setPayments(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // Extract unique clients that have payments
  const clientsWithPayments = (() => {
    const map = new Map()
    for (const p of payments) {
      if (p.client_id && p.client?.name) {
        map.set(p.client_id, { id: p.client_id, name: p.client.name })
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  })()

  return { payments, clientsWithPayments, loading, error, refetch: fetchData }
}
