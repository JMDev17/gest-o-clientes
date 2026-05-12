import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

export function useServiceCatalog() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchServices = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('service_catalog')
      .select('*')
      .order('name')
    if (err) {
      console.error('[useServiceCatalog] fetch:', err)
      setError('Não foi possível carregar os serviços.')
    } else {
      setServices(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchServices() }, [fetchServices])

  async function createService(fields) {
    const { data, error: err } = await supabase
      .from('service_catalog')
      .insert({ ...fields, user_id: user.id })
      .select()
      .single()
    if (err) { console.error('[useServiceCatalog] create:', err); throw err }
    setServices(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'pt')))
    return data
  }

  async function updateService(id, fields) {
    const { data, error: err } = await supabase
      .from('service_catalog')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (err) { console.error('[useServiceCatalog] update:', err); throw err }
    setServices(prev =>
      prev.map(s => (s.id === id ? data : s)).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    )
    return data
  }

  async function deleteService(id) {
    const { error: err } = await supabase
      .from('service_catalog')
      .delete()
      .eq('id', id)
    if (err) { console.error('[useServiceCatalog] delete:', err); throw err }
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return { services, loading, error, fetchServices, createService, updateService, deleteService }
}
