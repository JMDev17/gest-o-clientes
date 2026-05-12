import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (err) {
      setError('Não foi possível carregar os clientes.')
    } else {
      setClients(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function createClient(fields) {
    const { data, error: err } = await supabase
      .from('clients')
      .insert({ ...fields, user_id: user.id })
      .select()
      .single()
    if (err) throw err
    setClients(prev =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    )
  }

  async function updateClient(id, fields) {
    const { data, error: err } = await supabase
      .from('clients')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setClients(prev => prev.map(c => (c.id === id ? data : c)))
  }

  async function deleteClient(id) {
    const { error: err } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    if (err) throw err
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return { clients, loading, error, createClient, updateClient, deleteClient }
}
