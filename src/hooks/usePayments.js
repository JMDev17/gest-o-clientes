import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { isBeforeToday } from '../utils/dateHelpers.js'

// Columns added by migrations — may not exist in all environments.
const MIGRATION_COLS = ['payment_type', 'installment_number', 'total_installments', 'recurrence_frequency']

function stripMigrationCols(row) {
  const r = { ...row }
  MIGRATION_COLS.forEach(c => delete r[c])
  return r
}

export const PAYMENT_STATUS = [
  { value: 'pendente',  label: 'Pendente',  style: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'pago',      label: 'Pago',      style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'atrasado',  label: 'Atrasado',  style: 'bg-red-50 text-red-700 ring-red-200' },
  { value: 'cancelado', label: 'Cancelado', style: 'bg-gray-100 text-gray-500 ring-gray-200' },
]

// Computes display status: marks 'pendente' as 'atrasado' when past due_date
export function effectiveStatus(payment) {
  if (payment.status === 'pago' || payment.status === 'cancelado') return payment.status
  if (isBeforeToday(payment.due_date)) return 'atrasado'
  return payment.status
}

function sortByDueDate(list) {
  return [...list].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })
}

export function usePayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchPayments = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('payments')
      .select('*, client:clients(id, name, company_name, whatsapp)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (err) {
      setError('Não foi possível carregar os pagamentos.')
    } else {
      setPayments(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function createPayment(fields) {
    const { data, error: err } = await supabase
      .from('payments')
      .insert({ ...fields, user_id: user.id })
      .select('*, client:clients(id, name, company_name, whatsapp)')
      .single()
    if (err) throw err
    setPayments(prev => sortByDueDate([...prev, data]))
  }

  async function createPayments(records) {
    const rows = records.map(r => ({ ...r, user_id: user.id }))

    let { data, error: err } = await supabase
      .from('payments')
      .insert(rows)
      .select('*, client:clients(id, name, company_name, whatsapp)')

    // If migration columns don't exist in the DB yet, retry with the base schema.
    // Run supabase/migrations/payments_columns_fix.sql to enable full payment-type tracking.
    if (err?.message?.includes('does not exist')) {
      console.warn('[usePayments] Migration columns missing — retrying with base schema. Run supabase/migrations/payments_columns_fix.sql.')
      const baseRows = rows.map(stripMigrationCols)
      ;({ data, error: err } = await supabase
        .from('payments')
        .insert(baseRows)
        .select('*, client:clients(id, name, company_name, whatsapp)'))
    }

    if (err) throw err
    setPayments(prev => sortByDueDate([...prev, ...data]))
  }

  async function updatePayment(id, fields) {
    const { data, error: err } = await supabase
      .from('payments')
      .update(fields)
      .eq('id', id)
      .select('*, client:clients(id, name, company_name, whatsapp)')
      .single()
    if (err) throw err
    setPayments(prev => sortByDueDate(prev.map(p => (p.id === id ? data : p))))
  }

  async function deletePayment(id) {
    const { error: err } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    if (err) throw err
    setPayments(prev => prev.filter(p => p.id !== id))
  }

  return { payments, loading, error, createPayment, createPayments, updatePayment, deletePayment }
}
