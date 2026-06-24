import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { useWorkspace } from './useWorkspace.js'

export function useContracts() {
  const { user } = useAuth()
  const { workspaceType } = useWorkspace()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchContracts = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('contracts')
      .select('*, clients(name)')
      .eq('contract_type', workspaceType)
      .order('created_at', { ascending: false })

    if (err) {
      setError('Não foi possível carregar os contratos/pacotes.')
    } else {
      setContracts(data)
    }
    setLoading(false)
  }, [user, workspaceType])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  async function createContract(fields) {
    const { data, error: err } = await supabase
      .from('contracts')
      .insert({ ...fields, user_id: user.id, contract_type: workspaceType })
      .select('*, clients(name)')
      .single()
    if (err) throw err
    setContracts(prev => [data, ...prev])
  }

  async function updateContract(id, fields) {
    const { data, error: err } = await supabase
      .from('contracts')
      .update(fields)
      .eq('id', id)
      .select('*, clients(name)')
      .single()
    if (err) throw err
    setContracts(prev => prev.map(c => (c.id === id ? data : c)))
  }

  async function deleteContract(id) {
    const { error: err } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
    if (err) throw err
    setContracts(prev => prev.filter(c => c.id !== id))
  }

  return { contracts, loading, error, createContract, updateContract, deleteContract }
}
