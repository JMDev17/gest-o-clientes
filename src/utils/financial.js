// Utilitários compartilhados do módulo financeiro

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function last6MonthKeys() {
  const keys = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

export function formatMonthLabel(mk) {
  const [y, m] = mk.split('-').map(Number)
  const label = new Date(y, m - 1).toLocaleString('pt-BR', { month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return { start: fmt(mon), end: fmt(sun) }
}

export function filterByPeriod(transactions, { period, mk, startDate, endDate }) {
  const today = todayKey()
  const curMonth = mk ?? monthKey()

  switch (period) {
    case 'today':
      return transactions.filter(t => t.date === today)
    case 'week': {
      const { start, end } = weekRange()
      return transactions.filter(t => t.date >= start && t.date <= end)
    }
    case 'month':
      return transactions.filter(t => t.date?.startsWith(curMonth))
    case 'year':
      return transactions.filter(t => t.date?.startsWith(curMonth.slice(0, 4)))
    case 'custom':
      return transactions.filter(t => {
        if (startDate && t.date < startDate) return false
        if (endDate   && t.date > endDate)   return false
        return true
      })
    default:
      return transactions
  }
}

export function computeSummary(transactions) {
  let income = 0, expenses = 0, incomePending = 0, expensesPending = 0

  for (const t of transactions) {
    const amt = Number(t.amount || 0)
    if (t.type === 'income') {
      if (t.status === 'paid')    income        += amt
      else                         incomePending  += amt
    } else {
      if (t.status === 'paid')    expenses      += amt
      else                         expensesPending += amt
    }
  }

  return { income, expenses, balance: income - expenses, incomePending, expensesPending }
}

export function groupByCategory(transactions) {
  const groups = {}
  for (const t of transactions) {
    const key = t.category_name || 'Outros'
    if (!groups[key]) groups[key] = { name: key, total: 0, count: 0, color: t.category?.color }
    groups[key].total += Number(t.amount || 0)
    groups[key].count += 1
  }
  return Object.values(groups).sort((a, b) => b.total - a.total)
}

export function buildMonthlyHistory(transactions, clientPayments, keys) {
  return keys.map(mk => {
    const txIncome = transactions
      .filter(t => t.scope === 'company' && t.type === 'income' && t.status === 'paid' && t.date?.startsWith(mk))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const clientIncome = clientPayments
      .filter(p => p.status === 'pago' && p.paid_date?.startsWith(mk))
      .reduce((s, p) => s + Number(p.amount || 0), 0)

    const expenses = transactions
      .filter(t => t.scope === 'company' && t.type === 'expense' && t.status === 'paid' && t.date?.startsWith(mk))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    return {
      month:    formatMonthLabel(mk),
      mk,
      receita:  txIncome + clientIncome,
      despesas: expenses,
    }
  })
}

export const PAYMENT_METHODS = [
  { value: '',               label: '— Não informado —' },
  { value: 'pix',            label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito',  label: 'Cartão de débito' },
  { value: 'boleto',         label: 'Boleto' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'outro',          label: 'Outro' },
]

export function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find(m => m.value === value)?.label ?? value ?? '—'
}

export function exportToCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => {
      const v = r[h] ?? ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(';')),
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
