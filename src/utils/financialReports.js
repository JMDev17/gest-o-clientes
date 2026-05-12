// ─────────────────────────────────────────────────────────────────────────────
// Financial Reports — pure utility functions
// No React dependencies — can be unit-tested standalone.
// ─────────────────────────────────────────────────────────────────────────────

import { effectiveStatus } from '../hooks/usePayments.js'
import { formatDateBR, parseLocalDate } from './dateHelpers.js'
import { formatCurrency } from './formatCurrency.js'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build "YYYY-MM" key from a YYYY-MM-DD date string */
function monthKey(dateStr) {
  if (!dateStr) return null
  return dateStr.slice(0, 7) // "2026-05" from "2026-05-20"
}

/** Today as YYYY-MM-DD */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── 1. Monthly metrics ──────────────────────────────────────────────────────

/**
 * Compute financial summary for a given month.
 * @param {Array} payments — full list with effectiveStatus computed
 * @param {number} month — 1-12
 * @param {number} year
 */
export function computeMonthMetrics(payments, month, year) {
  const mk = `${year}-${String(month).padStart(2, '0')}`
  const today = todayStr()

  // Payments due or paid in this month
  const inMonth = payments.filter(p => {
    const dueMatch = monthKey(p.due_date) === mk
    const paidMatch = monthKey(p.paid_date) === mk
    return dueMatch || paidMatch
  })

  // Paid in this month (by paid_date)
  const paidInMonth = payments.filter(
    p => p.status === 'pago' && monthKey(p.paid_date) === mk
  )

  const totalReceived = paidInMonth.reduce((s, p) => s + Number(p.amount), 0)

  // Pending in month (due in this month, still pendente)
  const pendingInMonth = inMonth.filter(p => effectiveStatus(p) === 'pendente')
  const totalPending = pendingInMonth.reduce((s, p) => s + Number(p.amount), 0)

  // Overdue in month (due in this month, now atrasado)
  const overdueInMonth = inMonth.filter(p => effectiveStatus(p) === 'atrasado')
  const totalOverdue = overdueInMonth.reduce((s, p) => s + Number(p.amount), 0)

  // Forecast = all non-cancelled payments due in month
  const forecastPayments = inMonth.filter(p => effectiveStatus(p) !== 'cancelado')
  const totalForecast = forecastPayments.reduce((s, p) => s + Number(p.amount), 0)

  // Unique paying clients
  const payingClientIds = new Set(paidInMonth.map(p => p.client_id).filter(Boolean))

  // Ticket médio
  const avgTicket = paidInMonth.length > 0 ? totalReceived / paidInMonth.length : 0

  // Default rate (atrasados / total not-cancelled)
  const activePmts = inMonth.filter(p => effectiveStatus(p) !== 'cancelado')
  const defaultRate = activePmts.length > 0
    ? (overdueInMonth.length / activePmts.length) * 100
    : 0

  // Payments due in next 7 days
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const dueNext7 = payments.filter(p => {
    if (effectiveStatus(p) === 'pago' || effectiveStatus(p) === 'cancelado') return false
    if (!p.due_date) return false
    const d = parseLocalDate(p.due_date)
    const t = parseLocalDate(today)
    return d && t && d >= t && d <= sevenDaysLater
  })

  return {
    totalReceived,
    totalPending,
    totalOverdue,
    totalForecast,
    paymentCount: inMonth.length,
    payingClients: payingClientIds.size,
    avgTicket,
    defaultRate,
    dueNext7Days: dueNext7.length,
    // raw arrays for downstream use
    inMonth,
    paidInMonth,
    pendingInMonth,
    overdueInMonth,
  }
}

// ── 2. Group by day ─────────────────────────────────────────────────────────

/**
 * Group payments by due_date.
 * Returns an array of { date, dateFormatted, payments, total } sorted newest-first.
 */
export function groupByDay(payments) {
  const map = new Map()

  for (const p of payments) {
    const key = p.due_date || '_sem_data'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  }

  const groups = []
  for (const [date, items] of map) {
    groups.push({
      date,
      dateFormatted: date === '_sem_data' ? 'Sem data' : formatDateBR(date),
      payments: items,
      total: items.reduce((s, p) => s + Number(p.amount), 0),
    })
  }

  // Sort newest first, "_sem_data" last
  groups.sort((a, b) => {
    if (a.date === '_sem_data') return 1
    if (b.date === '_sem_data') return -1
    return b.date.localeCompare(a.date)
  })

  return groups
}

// ── 3. Client history ───────────────────────────────────────────────────────

/**
 * Compute full history for a given client across ALL payments (not month-limited).
 */
export function computeClientHistory(allPayments, clientId) {
  const clientPmts = allPayments
    .filter(p => p.client_id === clientId)
    .sort((a, b) => {
      const da = a.due_date || ''
      const db = b.due_date || ''
      return db.localeCompare(da)
    })

  const totalContracted = clientPmts.reduce((s, p) => s + Number(p.amount), 0)

  const paid = clientPmts.filter(p => effectiveStatus(p) === 'pago')
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0)

  const pending = clientPmts.filter(p => effectiveStatus(p) === 'pendente')
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0)

  const overdue = clientPmts.filter(p => effectiveStatus(p) === 'atrasado')
  const totalOverdue = overdue.reduce((s, p) => s + Number(p.amount), 0)

  // Last paid payment
  const lastPaid = paid.length > 0
    ? paid.reduce((latest, p) => {
        const d1 = p.paid_date || p.due_date || ''
        const d2 = latest.paid_date || latest.due_date || ''
        return d1 > d2 ? p : latest
      })
    : null

  // Next due (earliest pending/overdue)
  const today = todayStr()
  const upcoming = clientPmts
    .filter(p => {
      const st = effectiveStatus(p)
      return (st === 'pendente' || st === 'atrasado') && p.due_date
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
  const nextDue = upcoming.length > 0 ? upcoming[0] : null

  return {
    payments: clientPmts,
    totalContracted,
    totalPaid,
    totalPending,
    totalOverdue,
    lastPaid,
    nextDue,
    count: clientPmts.length,
  }
}

// ── 4. Advanced filters ─────────────────────────────────────────────────────

/**
 * Apply all report filters.
 * @param {Array} payments
 * @param {Object} filters — { month, clientId, status, paymentType, contractId }
 *   month: "YYYY-MM" or ""
 */
export function filterPayments(payments, filters = {}) {
  return payments.filter(p => {
    // Month filter
    if (filters.month) {
      const dueMatch = monthKey(p.due_date) === filters.month
      const paidMatch = monthKey(p.paid_date) === filters.month
      if (!dueMatch && !paidMatch) return false
    }

    // Client filter
    if (filters.clientId && p.client_id !== filters.clientId) return false

    // Status filter (using effective status)
    if (filters.status && effectiveStatus(p) !== filters.status) return false

    // Payment type filter
    if (filters.paymentType && (p.payment_type || 'unico') !== filters.paymentType) return false

    // Contract filter
    if (filters.contractId && p.contract_id !== filters.contractId) return false

    return true
  })
}

// ── 5. CSV export ───────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

const TYPE_LABELS = {
  unico: 'Único',
  parcelado: 'Parcelado',
  entrada: 'Entrada',
  recorrente: 'Recorrente',
}

/**
 * Build CSV-ready row objects from a filtered payments array.
 */
export function buildCsvRows(payments) {
  return payments.map(p => ({
    Cliente: p.client?.name || '—',
    Descrição: p.notes || '—',
    Vencimento: p.due_date ? formatDateBR(p.due_date) : '—',
    Pagamento: p.paid_date ? formatDateBR(p.paid_date) : '—',
    Valor: formatCurrency(p.amount),
    Status: STATUS_LABELS[effectiveStatus(p)] || effectiveStatus(p),
    Tipo: TYPE_LABELS[p.payment_type || 'unico'] || p.payment_type || '—',
  }))
}

/**
 * Download a CSV file from row objects.
 */
export function downloadCsv(rows, filename = 'relatorio.csv') {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(';'),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';')
    ),
  ]

  const bom = '\uFEFF' // UTF-8 BOM for Excel
  const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
