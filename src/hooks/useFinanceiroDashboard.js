import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { monthKey, last6MonthKeys, buildMonthlyHistory, groupByCategory } from '../utils/financial.js'

const DEFAULTS = {
  monthlyRevenue:       0,
  monthlyExpenses:      0,
  profit:               0,
  proLaboreMonth:       0,
  companySaldo:         0,
  personalExpensesMonth:0,
  personalIncomeMonth:  0,
  personalSaldo:        0,
  chartData:            [],
  categoryData:         [],
  recentMovements:      [],
}

export function useFinanceiroDashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [clientPayments, setClientPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError(null)

    const [txRes, pmtRes] = await Promise.all([
      supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false }),
      supabase
        .from('payments')
        .select('id, amount, status, paid_date')
        .order('paid_date', { ascending: false }),
    ])

    if (txRes.error || pmtRes.error) {
      setError('Não foi possível carregar os dados financeiros.')
    }
    setTransactions(txRes.data ?? [])
    setClientPayments(pmtRes.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const computed = useMemo(() => {
    const mk = monthKey()

    const companyTx  = transactions.filter(t => t.scope === 'company')
    const personalTx = transactions.filter(t => t.scope === 'personal')

    // Receita do mês = transações de receita empresa + pagamentos de clientes recebidos
    const txIncomeMonth = companyTx
      .filter(t => t.type === 'income' && t.status === 'paid' && t.date?.startsWith(mk))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const clientIncomeMonth = clientPayments
      .filter(p => p.status === 'pago' && p.paid_date?.startsWith(mk))
      .reduce((s, p) => s + Number(p.amount || 0), 0)

    const monthlyRevenue = txIncomeMonth + clientIncomeMonth

    // Despesas do mês (excluindo pró-labore do total de despesas operacionais)
    const monthlyExpenses = companyTx
      .filter(t => t.type === 'expense' && t.status === 'paid' && t.date?.startsWith(mk) && t.category_name !== 'Pró-labore')
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    // Pró-labore retirado no mês
    const proLaboreMonth = companyTx
      .filter(t => t.type === 'expense' && t.status === 'paid' && t.date?.startsWith(mk) && t.category_name === 'Pró-labore')
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const profit = monthlyRevenue - monthlyExpenses - proLaboreMonth

    // Saldo empresa (histórico completo)
    const allClientIncome  = clientPayments.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount || 0), 0)
    const allCompanyIncome  = companyTx.filter(t => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + Number(t.amount || 0), 0)
    const allCompanyExpenses = companyTx.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + Number(t.amount || 0), 0)
    const companySaldo = allClientIncome + allCompanyIncome - allCompanyExpenses

    // Pessoal
    const personalExpensesMonth = personalTx
      .filter(t => t.type === 'expense' && t.status === 'paid' && t.date?.startsWith(mk))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const personalIncomeMonth = personalTx
      .filter(t => t.type === 'income' && t.status === 'paid' && t.date?.startsWith(mk))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const allPersonalIncome   = personalTx.filter(t => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + Number(t.amount || 0), 0)
    const allPersonalExpenses = personalTx.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + Number(t.amount || 0), 0)
    const personalSaldo = allPersonalIncome - allPersonalExpenses

    // Gráfico histórico 6 meses
    const chartData = buildMonthlyHistory(transactions, clientPayments, last6MonthKeys())

    // Gráfico por categoria (despesas empresa este mês)
    const monthExpenses = companyTx.filter(t => t.type === 'expense' && t.status === 'paid' && t.date?.startsWith(mk))
    const categoryData  = groupByCategory(monthExpenses)

    // Últimas movimentações
    const recentMovements = [...transactions]
      .slice(0, 15)
      .map(t => ({
        id:          t.id,
        date:        t.date,
        description: t.description,
        amount:      Number(t.amount || 0),
        type:        t.type,
        scope:       t.scope,
        category:    t.category_name,
        status:      t.status,
      }))

    return {
      monthlyRevenue,
      monthlyExpenses,
      profit,
      proLaboreMonth,
      companySaldo,
      personalExpensesMonth,
      personalIncomeMonth,
      personalSaldo,
      chartData,
      categoryData,
      recentMovements,
    }
  }, [transactions, clientPayments])

  return { ...DEFAULTS, ...computed, loading, error, refetch: fetchAll }
}
