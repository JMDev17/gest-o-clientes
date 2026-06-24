import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'

const SELECT = '*, category:financial_categories(id, name, color)'

function sortByDate(list) {
  return [...list].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })
}

export function useFinancial() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('financial_transactions')
      .select(SELECT)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (err) {
      setError('Não foi possível carregar as transações.')
    } else {
      setTransactions(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function createTransaction(fields) {
    const { data, error: err } = await supabase
      .from('financial_transactions')
      .insert({ ...fields, user_id: user.id })
      .select(SELECT)
      .single()
    if (err) throw err
    setTransactions(prev => sortByDate([data, ...prev]))
    return data
  }

  async function updateTransaction(id, fields) {
    const { data, error: err } = await supabase
      .from('financial_transactions')
      .update(fields)
      .eq('id', id)
      .select(SELECT)
      .single()
    if (err) throw err
    setTransactions(prev => sortByDate(prev.map(t => t.id === id ? data : t)))
    return data
  }

  async function deleteTransaction(id) {
    const { error: err } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id)
    if (err) throw err
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // Pró-labore: cria duas transações vinculadas (empresa → pessoal)
  async function createTransfer({ amount, date, notes }) {
    const groupId = crypto.randomUUID()

    const rows = [
      {
        user_id:           user.id,
        scope:             'company',
        type:              'expense',
        description:       'Retirada de pró-labore',
        amount:            Number(amount),
        category_name:     'Pró-labore',
        date,
        payment_method:    'transferencia',
        status:            'paid',
        notes:             notes || null,
        transfer_group_id: groupId,
      },
      {
        user_id:           user.id,
        scope:             'personal',
        type:              'income',
        description:       'Pró-labore recebido',
        amount:            Number(amount),
        category_name:     'Pró-labore',
        date,
        payment_method:    'transferencia',
        status:            'paid',
        notes:             notes || null,
        transfer_group_id: groupId,
      },
    ]

    const { data, error: err } = await supabase
      .from('financial_transactions')
      .insert(rows)
      .select(SELECT)
    if (err) throw err

    setTransactions(prev => sortByDate([...data, ...prev]))
    return data
  }

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createTransfer,
    refetch: fetchTransactions,
  }
}
