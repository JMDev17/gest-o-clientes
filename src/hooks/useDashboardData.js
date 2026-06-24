import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from './useAuth.js'
import { useWorkspace } from './useWorkspace.js'
import { effectiveStatus } from './usePayments.js'
import { effectiveTaskStatus } from './useTasks.js'
import { todayISO } from '../utils/dateHelpers.js'

// ── Defaults (NEVER return undefined) ────────────────────────────────────────

const DEFAULTS = {
  activeClients: 0,
  receivedMonth: 0,
  forecastMonth: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  overdueTasks: 0,
  openTasks: 0,
  pendingPaymentsCount: 0,
  overduePaymentsCount: 0,
  clientsWithoutContentCount: 0,
  contractsEndingCount: 0,
  remainingSessions: 0,
  weekAppointmentsCount: 0,
  todayTasks: [],
  todayPayments: [],
  todayAppointments: [],
  upcomingAppointments: [],
  pendingPayments: [],
  overduePayments: [],
  contractsEnding: [],
  lowSessionContracts: [],
  clientsWithoutContent: [],
  revenueHistory: [],
  recentActivity: [],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { start: mon, end: sun }
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function last6MonthKeys() {
  const keys = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

/** Safe Supabase query — never throws, returns [] on error */
async function safeQuery(queryBuilder, label) {
  try {
    const { data, error } = await queryBuilder
    if (error) {
      console.error(`[Dashboard] Erro ao carregar ${label}:`, error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error(`[Dashboard] Falha inesperada em ${label}:`, err)
    return []
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData() {
  const { user } = useAuth()
  const { workspaceType } = useWorkspace()

  const [clients, setClients]           = useState([])
  const [payments, setPayments]         = useState([])
  const [tasks, setTasks]               = useState([])
  const [contracts, setContracts]       = useState([])
  const [appointments, setAppointments] = useState([])
  const [contentPlans, setContentPlans] = useState([])
  const [loading, setLoading]           = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    const [c, p, t, ct, a, cp] = await Promise.all([
      safeQuery(
        supabase.from('clients').select('id, name, status').order('name'),
        'clients',
      ),
      safeQuery(
        supabase.from('payments').select('*, client:clients(id, name)').order('due_date', { ascending: false }),
        'payments',
      ),
      safeQuery(
        supabase.from('tasks').select('*, client:clients(id, name)').order('due_date', { ascending: true, nullsFirst: false }),
        'tasks',
      ),
      safeQuery(
        supabase.from('contracts').select('*, clients(name)').eq('contract_type', workspaceType).order('end_date', { ascending: true }),
        'contracts',
      ),
      safeQuery(
        supabase.from('appointments').select('*, client:clients(id,name)').order('appointment_date', { ascending: true }),
        'appointments',
      ),
      safeQuery(
        supabase.from('content_plans').select('*, client:clients(id, name, company_name)').order('created_at', { ascending: true }),
        'content_plans',
      ),
    ])

    setClients(c)
    setPayments(p)
    setTasks(t)
    setContracts(ct)
    setAppointments(a)
    setContentPlans(cp)
    setLoading(false)
  }, [user, workspaceType])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived data ─────────────────────────────────────────────────────────

  const computed = useMemo(() => {
    const month = currentMonthKey()
    const today = todayISO()
    const { start: weekStart, end: weekEnd } = weekRange()
    const in30 = addDays(new Date(), 30).toISOString().slice(0, 10)

    // Clients
    const activeClients = clients.filter(c => c.status === 'ativo').length

    // Payments
    const monthPayments = payments.filter(p => p.due_date?.startsWith(month))
    const receivedMonth = payments
      .filter(p => p.status === 'pago' && p.paid_date?.startsWith(month))
      .reduce((s, p) => s + Number(p.amount || 0), 0)
    const forecastMonth = monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const pendingPayments = payments.filter(p => effectiveStatus(p) === 'pendente')
    const pendingAmount = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const overduePayments = payments.filter(p => effectiveStatus(p) === 'atrasado')
    const overdueAmount = overduePayments.reduce((s, p) => s + Number(p.amount || 0), 0)

    // Tasks
    const overdueTasks = tasks.filter(t => effectiveTaskStatus(t) === 'atrasada')
    const openTasks = tasks.filter(t => {
      const eff = effectiveTaskStatus(t)
      return eff === 'pendente' || eff === 'em_andamento' || eff === 'atrasada'
    })

    // Tasks due today
    const todayTasks = tasks.filter(t =>
      t.due_date === today &&
      effectiveTaskStatus(t) !== 'concluida' &&
      effectiveTaskStatus(t) !== 'cancelada'
    )

    // Payments due today
    const todayPayments = payments.filter(p =>
      p.due_date === today &&
      effectiveStatus(p) !== 'pago' &&
      effectiveStatus(p) !== 'cancelado'
    )

    // Contracts ending within 30 days
    const contractsEnding = contracts.filter(c =>
      c.status === 'ativo' && c.end_date && c.end_date <= in30 && c.end_date >= today
    )

    // Contracts with low remaining sessions (estetica)
    const lowSessionContracts = contracts.filter(c => {
      if (c.status !== 'ativo' || !c.total_sessions) return false
      const remaining = (c.total_sessions || 0) - (c.completed_sessions || 0)
      return remaining > 0 && remaining <= 3
    })

    // Remaining sessions total
    const remainingSessions = contracts
      .filter(c => c.status === 'ativo')
      .reduce((acc, c) => acc + Math.max(0, (c.total_sessions || 0) - (c.completed_sessions || 0)), 0)

    // Appointments this week
    const weekAppointments = appointments.filter(a => {
      if (!a.appointment_date) return false
      const [y, m, d] = a.appointment_date.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      return dt >= weekStart && dt <= weekEnd
    })

    // Today's appointments
    const todayAppointments = appointments.filter(a => a.appointment_date === today)

    // Upcoming appointments (next 7 days, after today)
    const in7 = addDays(new Date(), 7).toISOString().slice(0, 10)
    const upcomingAppointments = appointments.filter(a =>
      a.appointment_date > today && a.appointment_date <= in7 &&
      a.status !== 'cancelado' && a.status !== 'realizado'
    )

    // Content plans with pending clients (marketing)
    const clientsWithContent = new Set(contentPlans.map(p => p.client_id))
    const clientsWithoutContent = clients.filter(c =>
      c.status === 'ativo' && !clientsWithContent.has(c.id)
    )

    // Revenue last 6 months (chart)
    const monthKeys = last6MonthKeys()
    const revenueHistory = monthKeys.map(mk => {
      const received = payments
        .filter(p => p.status === 'pago' && p.paid_date?.startsWith(mk))
        .reduce((s, p) => s + Number(p.amount || 0), 0)
      const pending = payments
        .filter(p => {
          const eff = effectiveStatus(p)
          return p.due_date?.startsWith(mk) && (eff === 'pendente' || eff === 'atrasado')
        })
        .reduce((s, p) => s + Number(p.amount || 0), 0)
      const [y, m] = mk.split('-')
      const label = new Date(Number(y), Number(m) - 1).toLocaleString('pt-BR', { month: 'short' })
      return { month: label.charAt(0).toUpperCase() + label.slice(1), received, pending }
    })

    // Recent activity (last 10 payments or tasks created, merged & sorted)
    const recentActivity = [
      ...payments.slice(0, 10).map(p => ({
        type: 'payment',
        label: `Pagamento — ${p.client?.name ?? 'Sem cliente'}`,
        detail: `R$ ${Number(p.amount || 0).toFixed(2)}`,
        date: p.created_at,
        status: effectiveStatus(p),
      })),
      ...tasks.filter(t => t.created_at).slice(0, 10).map(t => ({
        type: 'task',
        label: `Tarefa — ${t.title}`,
        detail: t.client?.name ?? '',
        date: t.created_at,
        status: effectiveTaskStatus(t),
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8)

    return {
      activeClients,
      receivedMonth,
      forecastMonth,
      pendingAmount,
      overdueAmount,
      overdueTasks: overdueTasks.length,
      openTasks: openTasks.length,
      pendingPaymentsCount: pendingPayments.length,
      overduePaymentsCount: overduePayments.length,
      clientsWithoutContentCount: clientsWithoutContent.length,
      contractsEndingCount: contractsEnding.length,
      remainingSessions,
      weekAppointmentsCount: weekAppointments.length,
      todayTasks,
      todayPayments,
      todayAppointments,
      upcomingAppointments,
      pendingPayments: pendingPayments.slice(0, 5),
      overduePayments: overduePayments.slice(0, 5),
      contractsEnding,
      lowSessionContracts,
      clientsWithoutContent: clientsWithoutContent.slice(0, 5),
      revenueHistory,
      recentActivity,
    }
  }, [clients, payments, tasks, contracts, appointments, contentPlans])

  // ALWAYS return a safe object — spread DEFAULTS first, then computed values
  return { ...DEFAULTS, ...computed, loading, refetch: fetchAll }
}
